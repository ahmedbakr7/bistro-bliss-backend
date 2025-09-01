import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt, {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
} from "jsonwebtoken"; // Added specific error classes (Reason: enables granular error responses)
import env from "../util/env";
import { ServiceError } from "../util/common/common";
import { JwtPayload } from "../controllers/authController"; // TODO: Consider moving shared types to a dedicated module (Reason: reduce tight coupling with controller layer)

// Extend Request typing locally; consider global declaration merging for reuse (Reason: improves type safety across app)
export interface AuthenticatedRequest extends Request {
    auth?: { id: string; role: string };
}

// Centralized constants (Reason: avoid magic values & ease future changes)
const ACCESS_TOKEN_ALGORITHMS: jwt.Algorithm[] = ["HS256"]; // Restrict algorithms (Reason: mitigate algorithm confusion attacks)

/**
 * JWT verification & authorization middleware factory.
 * @param roles Optional list of allowed roles. If omitted, only authentication is enforced.
 * (Reason: allows reuse for endpoints that only need a valid user, separating authN from authZ)
 */
export const verifyJWT = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // 1. Extract & validate Authorization header (Reason: enforce Bearer schema early)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ServiceError(
                "Unauthorized - Missing or malformed Authorization header",
                401,
                "middleware:verifyJWT"
            );
        }

        // 2. Safely extract token (Reason: avoid non-null assertion & handle empty segments)
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new ServiceError(
                "Unauthorized - Token not provided",
                401,
                "middleware:verifyJWT"
            );
        }

        try {
            // 3. Verify token with explicit algorithm constraint (Reason: security hardening)
            const decoded = jwt.verify(
                token,
                env.ACCESS_TOKEN_SECRET as string,
                {
                    algorithms: ACCESS_TOKEN_ALGORITHMS,
                    // audience, issuer, subject can be enforced here if added to token (Reason: stronger validation)
                }
            ) as JwtPayload;

            // 4. Attach auth claims AFTER successful verification (Reason: prevent using untrusted data)
            req.auth = { id: decoded.userId, role: decoded.role };

            // 5. Authorization: only if roles array supplied (Reason: allow pure authentication usage)
            // if (roles && roles.length > 0) {
            //     if (!req.auth.role || !roles.includes(req.auth.role)) {
            //         throw new ServiceError(
            //             "Forbidden - Insufficient role",
            //             403,
            //             "middleware:verifyJWT"
            //         );
            //     }
            // }

            return next();
        } catch (err) {
            // 6. Granular JWT error mapping (Reason: clearer client feedback while not leaking internals)
            if (err instanceof TokenExpiredError) {
                throw new ServiceError(
                    "Unauthorized - Token expired",
                    401,
                    "middleware:verifyJWT"
                );
            }
            if (err instanceof NotBeforeError) {
                throw new ServiceError(
                    "Unauthorized - Token not active yet",
                    401,
                    "middleware:verifyJWT"
                );
            }
            if (err instanceof JsonWebTokenError) {
                throw new ServiceError(
                    "Unauthorized - Invalid token",
                    401,
                    "middleware:verifyJWT"
                );
            }
            // 7. Fallback unexpected error (Reason: avoid exposing raw error details)
            throw new ServiceError(
                "Unauthorized - Token verification failed",
                401,
                "middleware:verifyJWT"
            );
        }
    }
);

// export const verifyJWT = (roles?: string[]) => {
//     return asyncHandler(
//         async (
//             req: AuthenticatedRequest,
//             res: Response,
//             next: NextFunction
//         ) => {
//             // 1. Extract & validate Authorization header (Reason: enforce Bearer schema early)
//             const authHeader = req.headers.authorization;
//             if (!authHeader || !authHeader.startsWith("Bearer ")) {
//                 throw new ServiceError(
//                     "Unauthorized - Missing or malformed Authorization header",
//                     401,
//                     "middleware:verifyJWT"
//                 );
//             }

//             // 2. Safely extract token (Reason: avoid non-null assertion & handle empty segments)
//             const token = authHeader.split(" ")[1];
//             if (!token) {
//                 throw new ServiceError(
//                     "Unauthorized - Token not provided",
//                     401,
//                     "middleware:verifyJWT"
//                 );
//             }

//             try {
//                 // 3. Verify token with explicit algorithm constraint (Reason: security hardening)
//                 const decoded = jwt.verify(
//                     token,
//                     env.ACCESS_TOKEN_SECRET as string,
//                     {
//                         algorithms: ACCESS_TOKEN_ALGORITHMS,
//                         // audience, issuer, subject can be enforced here if added to token (Reason: stronger validation)
//                     }
//                 ) as JwtPayload;

//                 // 4. Attach auth claims AFTER successful verification (Reason: prevent using untrusted data)
//                 req.auth = { id: decoded.userId, role: decoded.role };

//                 // 5. Authorization: only if roles array supplied (Reason: allow pure authentication usage)
//                 if (roles && roles.length > 0) {
//                     if (!req.auth.role || !roles.includes(req.auth.role)) {
//                         throw new ServiceError(
//                             "Forbidden - Insufficient role",
//                             403,
//                             "middleware:verifyJWT"
//                         );
//                     }
//                 }

//                 return next();
//             } catch (err) {
//                 // 6. Granular JWT error mapping (Reason: clearer client feedback while not leaking internals)
//                 if (err instanceof TokenExpiredError) {
//                     throw new ServiceError(
//                         "Unauthorized - Token expired",
//                         401,
//                         "middleware:verifyJWT"
//                     );
//                 }
//                 if (err instanceof NotBeforeError) {
//                     throw new ServiceError(
//                         "Unauthorized - Token not active yet",
//                         401,
//                         "middleware:verifyJWT"
//                     );
//                 }
//                 if (err instanceof JsonWebTokenError) {
//                     throw new ServiceError(
//                         "Unauthorized - Invalid token",
//                         401,
//                         "middleware:verifyJWT"
//                     );
//                 }
//                 // 7. Fallback unexpected error (Reason: avoid exposing raw error details)
//                 throw new ServiceError(
//                     "Unauthorized - Token verification failed",
//                     401,
//                     "middleware:verifyJWT"
//                 );
//             }
//         }
//     );
// };
// Additional improvement suggestions (not executed here):
// - Add issuer (iss), audience (aud), subject (sub) claims & verify them.
// - Introduce jti + token revocation / blacklist (Reason: enable logout & compromise mitigation).
// - Move role names to an enum or config (Reason: prevent typos & centralize authz logic).
