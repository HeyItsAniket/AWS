const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");


// ==================== FORGOT PASSWORD ====================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;


        // Check email

        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Email is required"
            });

        }


        // Find user

        const user = await User.findOne({

            where: {
                email: email
            }

        });


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }


        // Generate a one-time code that the user enters on the website.
        const resetCode =
            crypto.randomInt(0, 1_000_000_000_000)
                .toString()
                .padStart(12, "0");

        const resetCodeHash =
            crypto.createHash("sha256")
                .update(resetCode)
                .digest("hex");


        // Token will expire after 30 minutes

        const resetTokenExpiry = new Date(
            Date.now() + 30 * 60 * 1000
        );


        // Save token in database

        user.resetToken = resetCodeHash;
        user.resetTokenExpiry = resetTokenExpiry;

        await user.save();


        // Create SMTP transporter

        const transporter = nodemailer.createTransport({

            service: "gmail",

            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }

        });


        // Send reset code

        await transporter.sendMail({

            from: process.env.SMTP_EMAIL,

            to: email,

            subject: "Reset Your Password",

            html: `

                <h2>Password Reset</h2>

                <p>Hello ${user.name},</p>

                <p>
                    You requested to reset your password.
                </p>

                <p>Enter this code on the password reset page:</p>

                <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
                    ${resetCode}
                </p>

                <p>
                    This code will expire in 30 minutes and can only be used once.
                </p>

            `

        });


        return res.status(200).json({

            success: true,

            message: "A password reset code has been sent to your email"

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to send reset email"

        });

    }

};


// ==================== RESET PASSWORD ====================

const resetPassword = async (req, res) => {

    try {

        const { resetCode, newPassword } = req.body;


        // Check required fields

        if (!resetCode || !newPassword) {

            return res.status(400).json({

                success: false,

                message: "Reset code and new password are required"

            });

        }


        if (!/^\d{12}$/.test(resetCode)) {

            return res.status(400).json({

                success: false,

                message: "Invalid reset code"

            });

        }


        const resetCodeHash =
            crypto.createHash("sha256")
                .update(resetCode)
                .digest("hex");


        // Find user using the hashed reset code

        const user = await User.findOne({

            where: {
                resetToken: resetCodeHash
            }

        });


        if (!user) {

            return res.status(400).json({

                success: false,

                message: "Invalid reset code"

            });

        }


        // Check token expiry

        if (
            !user.resetTokenExpiry ||
            new Date() > new Date(user.resetTokenExpiry)
        ) {

            return res.status(400).json({

                success: false,

                message: "Reset code has expired"

            });

        }


        // Hash new password

        const hashedPassword =
            await bcrypt.hash(newPassword, 10);


        // Update password

        user.password = hashedPassword;


        // Remove used reset token

        user.resetToken = null;
        user.resetTokenExpiry = null;


        // Save changes

        await user.save();


        return res.status(200).json({

            success: true,

            message: "Password reset successfully"

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to reset password"

        });

    }

};


// ==================== EXPORT ====================

module.exports = {

    forgotPassword,
    resetPassword

};