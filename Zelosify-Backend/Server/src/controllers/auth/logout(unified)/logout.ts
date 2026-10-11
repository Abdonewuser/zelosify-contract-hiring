import { Response } from "express";
import { AuthenticatedRequest } from "../../../types/common.js";
import asyncHandler from "../../../utils/handler/asyncHandler.js";
import { getAdminToken } from "../../../utils/keycloak/getAdminToken.js";
import { getClientSecret } from "../../../config/keycloak/keycloak.js";
import axios from "axios";

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const refreshToken =
        req.cookies?.refresh_token || req.headers.authorization?.split(" ")[1];
      const user = (req as any).user;

      if (user && user.provider === "KEYCLOAK" && refreshToken) {
        try {
          const adminToken = await getAdminToken();
          const clientSecret = await getClientSecret(adminToken);
          if (clientSecret) {
            await axios.post(
              `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
              new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: clientSecret,
                refresh_token: refreshToken,
              }),
              { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            console.log("Keycloak session invalidated for user.");
          }
        } catch (error: any) {
          console.warn("Keycloak logout warning (continuing local logout):", error?.message);
        }
      }

      // Clear cookies securely
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/" });
      res.clearCookie("role", { path: "/" });

      res.status(200).json({ message: "Logged out successfully" });
      return;
    } catch (error) {
      console.warn("Logout error handled:", error);
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/" });
      res.clearCookie("role", { path: "/" });
      res.status(200).json({ message: "Logged out successfully" });
      return;
    }
  }
);
