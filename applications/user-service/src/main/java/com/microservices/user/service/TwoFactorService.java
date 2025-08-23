package com.microservices.user.service;

import com.microservices.user.model.User;
import com.microservices.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

@Service
public class TwoFactorService {
    
    @Autowired
    private UserRepository userRepository;
    
    private static final String ISSUER = "Microservices Platform";
    
    public Map<String, Object> setupTwoFactor(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Generate secret key for TOTP
        String secret = generateSecretKey();
        
        // Store secret temporarily (should be stored securely)
        user.setTwoFactorSecret(secret);
        userRepository.save(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("secret", secret);
        response.put("qrCodeUrl", generateQRCodeUrl(user.getEmail(), secret));
        response.put("qrCode", generateQRCodeImage(user.getEmail(), secret));
        response.put("backupCodes", generateBackupCodes());
        
        return response;
    }
    
    public Map<String, Object> verifyAndEnable(Long userId, String code) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getTwoFactorSecret() == null) {
            throw new RuntimeException("2FA not setup");
        }
        
        boolean isValid = verifyTOTP(user.getTwoFactorSecret(), code);
        
        if (!isValid) {
            throw new RuntimeException("Invalid code");
        }
        
        // Enable 2FA
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "2FA enabled successfully");
        response.put("enabled", true);
        
        return response;
    }
    
    public void disableTwoFactor(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
    }
    
    public Map<String, Object> getTwoFactorStatus(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("enabled", user.isTwoFactorEnabled());
        
        return response;
    }
    
    private String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        
        // Use Base32 encoding for TOTP (required by RFC 6238)
        String base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder base32 = new StringBuilder();
        
        for (int i = 0; i < bytes.length; i += 5) {
            long buffer = 0;
            int bufferLength = 0;
            
            for (int j = 0; j < 5 && i + j < bytes.length; j++) {
                buffer = (buffer << 8) | (bytes[i + j] & 0xFF);
                bufferLength += 8;
            }
            
            while (bufferLength >= 5) {
                int index = (int) ((buffer >> (bufferLength - 5)) & 0x1F);
                base32.append(base32Chars.charAt(index));
                bufferLength -= 5;
            }
            
            if (bufferLength > 0) {
                int index = (int) ((buffer << (5 - bufferLength)) & 0x1F);
                base32.append(base32Chars.charAt(index));
            }
        }
        
        return base32.toString();
    }
    
    private String generateQRCodeUrl(String email, String secret) {
        try {
            String encodedIssuer = java.net.URLEncoder.encode(ISSUER, "UTF-8");
            String encodedEmail = java.net.URLEncoder.encode(email, "UTF-8");
            return String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s",
                encodedIssuer, encodedEmail, secret, encodedIssuer
            );
        } catch (Exception e) {
            throw new RuntimeException("Error encoding QR code URL", e);
        }
    }
    
    private String[] generateBackupCodes() {
        SecureRandom random = new SecureRandom();
        String[] codes = new String[10];
        
        for (int i = 0; i < 10; i++) {
            codes[i] = String.format("%08d", random.nextInt(100000000));
        }
        
        return codes;
    }
    
    private boolean verifyTOTP(String secret, String code) {
        try {
            // Simple verification - in production use proper TOTP library
            // This is a simplified implementation
            long timeWindow = System.currentTimeMillis() / 30000; // 30 second window
            String expectedCode = generateTOTP(secret, timeWindow);
            
            return code.equals(expectedCode) || 
                   code.equals(generateTOTP(secret, timeWindow - 1)) ||
                   code.equals(generateTOTP(secret, timeWindow + 1));
        } catch (Exception e) {
            return false;
        }
    }
    
    private String generateTOTP(String secret, long timeWindow) throws Exception {
        byte[] key = decodeBase32(secret);
        byte[] data = new byte[8];
        
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (timeWindow & 0xFF);
            timeWindow >>= 8;
        }
        
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(data);
        
        int offset = hash[hash.length - 1] & 0xF;
        int code = ((hash[offset] & 0x7F) << 24) |
                   ((hash[offset + 1] & 0xFF) << 16) |
                   ((hash[offset + 2] & 0xFF) << 8) |
                   (hash[offset + 3] & 0xFF);
        
        code = code % 1000000;
        return String.format("%06d", code);
    }
    
    private byte[] decodeBase32(String base32) {
        String base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        int[] charMap = new int[256];
        for (int i = 0; i < base32Chars.length(); i++) {
            charMap[base32Chars.charAt(i)] = i;
        }
        
        // Remove padding and convert to uppercase
        base32 = base32.replaceAll("=", "").toUpperCase();
        
        byte[] result = new byte[base32.length() * 5 / 8];
        int buffer = 0;
        int bufferLength = 0;
        int resultIndex = 0;
        
        for (char c : base32.toCharArray()) {
            buffer = (buffer << 5) | charMap[c];
            bufferLength += 5;
            
            if (bufferLength >= 8) {
                result[resultIndex++] = (byte) (buffer >> (bufferLength - 8));
                bufferLength -= 8;
            }
        }
        
        byte[] trimmed = new byte[resultIndex];
        System.arraycopy(result, 0, trimmed, 0, resultIndex);
        return trimmed;
    }
    
    private String generateQRCodeImage(String email, String secret) {
        try {
            String qrCodeUrl = generateQRCodeUrl(email, secret);
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrCodeUrl, BarcodeFormat.QR_CODE, 200, 200);
            
            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", outputStream);
            
            byte[] imageBytes = outputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Error generating QR code image", e);
        }
    }
}