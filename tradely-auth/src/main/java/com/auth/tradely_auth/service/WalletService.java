package com.auth.tradely_auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.stereotype.Service;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;

@Service
public class WalletService {

    @Value("${wallet.encryption.password}")
    private String encryptionPassword;

    @Value("${wallet.encryption.salt}")
    private String encryptionSalt;

    private BytesEncryptor encryptor;

    @PostConstruct
    public void init() {
        // Encryptors.stronger() de Spring Security usa AES-256 en modo GCM por debajo
        this.encryptor = Encryptors.stronger(encryptionPassword, encryptionSalt);
    }

    public record WalletResult(String address, String privateKey) {}

    public WalletResult generateWallet() {
        try {
            ECKeyPair ecKeyPair = Keys.createEcKeyPair();
            String privateKey = ecKeyPair.getPrivateKey().toString(16);
            String address = "0x" + Keys.getAddress(ecKeyPair);
            
            return new WalletResult(address, privateKey);
        } catch (InvalidAlgorithmParameterException | NoSuchAlgorithmException | NoSuchProviderException e) {
            throw new RuntimeException("Error generating wallet", e);
        }
    }

    public String encryptPrivateKey(String privateKey) {
        // Encriptar en GCM y convertir los bytes resultantes a Hexadecimal para guardar como String
        byte[] encryptedBytes = encryptor.encrypt(privateKey.getBytes(StandardCharsets.UTF_8));
        return new String(org.springframework.security.crypto.codec.Hex.encode(encryptedBytes));
    }

    public String decryptPrivateKey(String encryptedPrivateKey) {
        try {
            // Manejo por si la clave antigua usaba el placeholder
            if (encryptedPrivateKey.startsWith("ENCRYPTED_")) {
                return encryptedPrivateKey.substring("ENCRYPTED_".length());
            }

            // Convertir de Hexadecimal a bytes y desencriptar
            byte[] decodedBytes = org.springframework.security.crypto.codec.Hex.decode(encryptedPrivateKey);
            byte[] decryptedBytes = encryptor.decrypt(decodedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new RuntimeException("Error desencriptando la clave privada con Spring Security GCM", e);
        }
    }
}
