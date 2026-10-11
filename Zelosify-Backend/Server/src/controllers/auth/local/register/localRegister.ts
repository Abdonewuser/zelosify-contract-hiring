import { Request, Response } from "express";
import asyncHandler from "../../../../utils/handler/asyncHandler.js";
import { RegisterRequest, RegisterResponse } from "../../../../types/auth.js";
import prisma from "../../../../config/prisma/prisma.js";
import QRCode from "qrcode";
import { getAdminToken } from "../../../../utils/keycloak/getAdminToken.js";
import { authenticator } from "otplib";
import { createKeycloakUser } from "../../../../utils/keycloak/createKeycloakUser.js";
import axios from "axios";
import { AuthProvider, Role } from "@prisma/client";
import { getClientSecret } from "../../../../config/keycloak/keycloak.js";
import { isValidRole } from "../../../../utils/RBAC/isValidRole.js";

import { isPrismaConnected } from "../../../../utils/prisma/connectPrisma.js";
import { devMockStore } from "../../../../services/devMockStore.js";
import jwt from "jsonwebtoken";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "dynamic-client";

/**
 * Register a new user with TOTP 2FA setup
 * @param req - Express request with RegisterRequest body
 * @param res - Express response with success or error data
 */
export const register = asyncHandler(
  async (req: Request<{}, any, any>, res: Response) => {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        companyName,
        department,
      } = req.body;

      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({ error: "Username, email, password, and name are required." });
        return;
      }

      // Safe fallback for tenantId
      const tenantId =
        req.body.tenantId || "8dc0e05b-2956-4d74-b0e9-5aea5ab3b748";

      // Map incoming role safely to valid Role enum
      let role: Role = Role.IT_VENDOR;
      const rawRole = req.body.role;
      if (rawRole === "HIRING_MANAGER" || rawRole === "MANAGER" || rawRole === "SENIOR_MANAGER") {
        role = Role.HIRING_MANAGER;
      } else if (rawRole === "ADMIN") {
        role = Role.ADMIN;
      } else if (rawRole === "IT_VENDOR" || rawRole === "USER") {
        role = Role.IT_VENDOR;
      } else if (isValidRole(rawRole)) {
        role = rawRole as Role;
      }

      // In dev fallback mode (Postgres/Keycloak offline)
      if (!isPrismaConnected && process.env.VITEST !== "true") {
        const totpSecret = authenticator.generateSecret();
        const userId = `dev-user-${Date.now()}`;
        const devUser = devMockStore.addUser({
          id: userId,
          username,
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || "+15550000",
          role: role as any,
          department: department || "Operations",
          tenantId,
          companyName: companyName || "Bruce Wayne Corp",
          provider: "KEYCLOAK",
          totpSecret,
        });

        const devAccessToken = jwt.sign(
          {
            sub: userId,
            preferred_username: username,
            email,
            role,
            realm_access: { roles: [role] },
          },
          process.env.JWT_SECRET || "dev-secret",
          { expiresIn: "4h" }
        );

        const devRefreshToken = jwt.sign(
          { sub: userId, type: "refresh" },
          process.env.JWT_SECRET || "dev-secret",
          { expiresIn: "30d" }
        );

        res.cookie("access_token", devAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 4 * 3600 * 1000,
          path: "/",
        });

        res.cookie("refresh_token", devRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 3600 * 1000,
          path: "/",
        });

        res.cookie("role", role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 3600 * 1000,
          path: "/",
        });

        const otpAuthUrl = authenticator.keyuri(email, REALM_NAME, totpSecret);
        const qrCode = await QRCode.toDataURL(otpAuthUrl);

        res.status(201).json({
          message: "User registered successfully.",
          user: devUser,
          qrCode,
          otpAuthUrl,
          expiresIn: 3600,
        });
        return;
      }

      // Get an admin token from Keycloak
      const adminToken = await getAdminToken();

      // Generate a TOTP secret for 2FA
      const totpSecret = authenticator.generateSecret();

      // Create the user in Keycloak
      const keycloakUser = await createKeycloakUser(adminToken, {
        username,
        email,
        firstName: firstName || username,
        lastName: lastName || "",
        enabled: true,
        credentials: [{ type: "password", value: password, temporary: false }],
      });

      //Assigning role to a user in keycloak
      if (keycloakUser.id && role) {
        try {
          // Attempt to fetch the specified role from Keycloak
          const roleResponse = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/${role}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          // Check if the role object is valid (e.g. it has an id)
          if (!roleResponse.data || !roleResponse.data.id) {
            console.error(`Role "${role}" not found in Keycloak.`);
          } else {
            try {
              // Assign the role to the user in Keycloak
              await axios.post(
                `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${keycloakUser.id}/role-mappings/realm`,
                [roleResponse.data],
                { headers: { Authorization: `Bearer ${adminToken}` } }
              );
              console.log(
                `Role "${role}" successfully assigned to user ${keycloakUser.id}.`
              );
            } catch (error) {
              console.error(
                `Error assigning role "${role}" to user ${keycloakUser.id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(`Failed to fetch role "${role}" from Keycloak:`, error);
        }
      }

      if (!keycloakUser.id) {
        res.status(500).json({ message: "Failed to create user in Keycloak" });
        return;
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          username,
          email,
          firstName,
          lastName,
          phoneNumber,
          department,
          role: role as Role,
          tenantId,
          externalId: keycloakUser.id,
          totpSecret,
          provider: AuthProvider.KEYCLOAK,
          creator: username,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          department: true,
          role: true,
          tenantId: true,
          provider: true,
        },
      });

      // Get initial tokens from Keycloak
      const tokenResponse = await axios.post(
        `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "password",
          client_id: CLIENT_ID,
          client_secret: await getClientSecret(adminToken),
          username: username,
          password: password,
          scope: "openid profile email roles offline_access",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // Set access token cookie
      res.cookie("access_token", tokenResponse.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000, // 1 hour
        path: "/",
      });

      // Set refresh token cookie
      if (tokenResponse.data.refresh_token) {
        res.cookie("refresh_token", tokenResponse.data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: "/",
        });
      }

      // Generate QR code for TOTP
      const otpAuthUrl = authenticator.keyuri(email, REALM_NAME, totpSecret);
      const qrCode = await QRCode.toDataURL(otpAuthUrl);

      // Return registration response with proper typing
      const response: RegisterResponse = {
        message:
          "User registered successfully. Scan the QR Code to configure TOTP.",
        user: {
          id: user.id,
          username: user.username || "",
          email: user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          department: user.department || "",
          role: user.role,
          tenantId: user.tenantId || "",
          provider: user.provider,
        },
        qrCode,
        otpAuthUrl,
        expiresIn: 3600, // 1 hour in seconds
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error registering user" });
    }
  }
);
