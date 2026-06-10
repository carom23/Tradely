package com.auth.tradely_auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Tradely - Recuperación de Contraseña");
            
            String htmlContent = "<div style='background-color:#000000; color:#ffffff; padding:40px; font-family:monospace; border:1px solid #333333; max-width:600px; margin:auto;'>"
                    + "<h1 style='letter-spacing:0.2em; color:#ffffff; border-bottom:1px solid #ffffff; padding-bottom:15px; text-transform:uppercase;'>TRADELY</h1>"
                    + "<p style='font-size:12px; color:#a3a3a3; text-transform:uppercase;'> SOLICITUD DE RESTABLECIMIENTO DE CREDENCIALES</p>"
                    + "<p style='font-size:11px; line-height:1.6;'>Has solicitado restablecer tu contraseña en la plataforma Tradely. Presiona el siguiente enlace seguro para continuar:</p>"
                    + "<div style='margin:30px 0; text-align:center;'>"
                    + "  <a href='" + resetLink + "' style='background-color:#ffffff; color:#000000; padding:12px 30px; text-decoration:none; font-weight:bold; font-size:11px; text-transform:uppercase; border:1px solid #ffffff; letter-spacing:0.1em;'>Restablecer Contraseña</a>"
                    + "</div>"
                    + "<p style='font-size:10px; color:#525252;'>Este enlace expirará en 15 minutos. Si no solicitaste esta acción, puedes ignorar este correo de forma segura.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Correo de restablecimiento enviado exitosamente a {}", toEmail);

        } catch (Exception e) {
            log.warn("Fallo al enviar correo mediante SMTP ({})", e.getMessage());
        }
    }

    public void sendVerificationEmail(String toEmail, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Tradely - Verificación de Correo");
            
            String htmlContent = "<div style='background-color:#000000; color:#ffffff; padding:40px; font-family:monospace; border:1px solid #333333; max-width:600px; margin:auto;'>"
                    + "<h1 style='letter-spacing:0.2em; color:#ffffff; border-bottom:1px solid #ffffff; padding-bottom:15px; text-transform:uppercase;'>TRADELY</h1>"
                    + "<p style='font-size:12px; color:#a3a3a3; text-transform:uppercase;'>VERIFICACIÓN DE CUENTA</p>"
                    + "<p style='font-size:11px; line-height:1.6;'>Gracias por registrarte en Tradely. Para activar tu cuenta e iniciar sesión, haz clic en el siguiente enlace de verificación:</p>"
                    + "<div style='margin:30px 0; text-align:center;'>"
                    + "  <a href='" + verificationLink + "' style='background-color:#ffffff; color:#000000; padding:12px 30px; text-decoration:none; font-weight:bold; font-size:11px; text-transform:uppercase; border:1px solid #ffffff; letter-spacing:0.1em;'>Verificar Correo</a>"
                    + "</div>"
                    + "<p style='font-size:10px; color:#525252;'>Si no creaste una cuenta en Tradely, puedes ignorar este correo de forma segura.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Correo de verificación enviado exitosamente a {}", toEmail);

        } catch (Exception e) {
            log.warn("Fallo al enviar correo de verificación mediante SMTP ({})", e.getMessage());

        }
    }

    public void sendAlertEmail(String toEmail, String metric, String coin, String alertType, double threshold, double currentValue) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String subject = "Tradely - Alerta Disparada";
            String title = "ALERTA DISPARADA";
            String description = "Una de tus alertas configuradas se ha activado.";
            String detailsHtml = "";

            if ("POSITION_PRICE".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta de Precio (" + coin + ")";
                title = "ALERTA DE PRECIO";
                description = "Tu alerta programada para <strong>" + coin + "</strong> se ha activado:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Activo:</strong> " + coin + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> $" + threshold + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#00ff00;'><strong>Precio actual:</strong> $" + currentValue + "</p>";
            } else if ("POSITION_PNL_USD".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta PnL USD (" + coin + ")";
                title = "ALERTA PNL USD";
                description = "El PnL en USD para tu posición en <strong>" + coin + "</strong> ha activado la alerta:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Activo:</strong> " + coin + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> $" + threshold + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#00ff00;'><strong>PnL actual:</strong> $" + currentValue + "</p>";
            } else if ("POSITION_PNL_PERCENT".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta ROI % (" + coin + ")";
                title = "ALERTA ROI %";
                description = "El ROI % para tu posición en <strong>" + coin + "</strong> ha activado la alerta:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Activo:</strong> " + coin + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> " + threshold + "%</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#00ff00;'><strong>ROI actual:</strong> " + String.format(java.util.Locale.US, "%.2f", currentValue) + "%</p>";
            } else if ("ACCOUNT_EQUITY_USD".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta Equity de Cuenta";
                title = "ALERTA EQUITY";
                description = "El valor neto (Equity) de tu cuenta ha activado la alerta:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> $" + threshold + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#00ff00;'><strong>Equity actual:</strong> $" + currentValue + "</p>";
            } else if ("ACCOUNT_PNL_USD".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta PnL de Cuenta";
                title = "ALERTA PNL DE CUENTA";
                description = "El PnL total acumulado de tus posiciones abiertas ha activado la alerta:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> $" + threshold + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#00ff00;'><strong>PnL acumulado actual:</strong> $" + currentValue + "</p>";
            } else if ("MARGIN_USAGE_PERCENT".equalsIgnoreCase(metric)) {
                subject = "Tradely - Alerta Uso de Margen";
                title = "ALERTA USO DE MARGEN";
                description = "El porcentaje de uso de margen de tu cuenta ha activado la alerta:";
                detailsHtml = "  <p style='font-size:11px; margin:5px 0;'><strong>Condición:</strong> " + alertType + "</p>"
                        + "  <p style='font-size:11px; margin:5px 0;'><strong>Umbral configurado:</strong> " + threshold + "%</p>"
                        + "  <p style='font-size:11px; margin:5px 0; color:#ff3333;'><strong>Uso actual:</strong> " + String.format(java.util.Locale.US, "%.2f", currentValue) + "%</p>";
            }

            helper.setTo(toEmail);
            helper.setSubject(subject);
                        String htmlContent = "<div style='background-color:#000000; color:#ffffff; padding:40px; font-family:monospace; border:1px solid #333333; max-width:600px; margin:auto;'>"
                    + "<h1 style='letter-spacing:0.2em; color:#ffffff; border-bottom:1px solid #ffffff; padding-bottom:15px; text-transform:uppercase;'>TRADELY</h1>"
                    + "<p style='font-size:12px; color:#a3a3a3; text-transform:uppercase;'>" + title + "</p>"
                    + "<p style='font-size:11px; line-height:1.6;'>" + description + "</p>"
                    + "<div style='margin:20px 0; border:1px solid #333333; padding:15px; background-color:#111111;'>"
                    + detailsHtml
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Correo de alerta de tipo {} enviado exitosamente a {}", metric, toEmail);

        } catch (Exception e) {
            log.warn("Fallo al enviar correo de alerta mediante SMTP ({})", e.getMessage());

        }
    }
}
