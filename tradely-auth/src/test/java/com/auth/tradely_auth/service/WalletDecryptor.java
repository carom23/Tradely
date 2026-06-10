package com.auth.tradely_auth.service;

import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.utils.Numeric;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;

public class WalletDecryptor {
    public static void main(String[] args) {
        String password = "your_ultra_secure_password_for_wallet_encryption_987!";
        String salt = "5c0744940b5c369b";
        
        BytesEncryptor encryptor = Encryptors.stronger(password, salt);
        
        // 1. prueba@prueba.com encrypted key from DB
        String encryptedKeyPrueba = "e186e03e9ba55e99ffd432ba5c7fe52459d81d7b10bf104b147034c4fdf7d7435941f76ce989e3b2c4753854ef4115671639e857dd744df5290f01b88fd33469bbf01b0cfd82fac590586003d56fdf7f6c941ea6c81c0fbad3e81ea84a086448";
        
        // 2. jcmarmolrecalde@gmail.com encrypted key from DB
        String encryptedKeyJc = "b4f725379a1a88487e1fd08333e8e6da6eac46acf3662237f6390830380129a1ae252e758666968935bc59fed58b52bbc092f5cd85a00e8723aa91acb2904c372e8c96b98b57c20c54486d7e460e79a212e4f70071a7abf0f4a37559c527c19a";
        
        try {
            System.out.println("--- PRUEBA@PRUEBA.COM ---");
            decryptAndDerive(encryptor, encryptedKeyPrueba);
            
            System.out.println("\n--- JCMARMOLRECALDE@GMAIL.COM ---");
            decryptAndDerive(encryptor, encryptedKeyJc);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private static void decryptAndDerive(BytesEncryptor encryptor, String hexEncrypted) throws Exception {
        byte[] decodedBytes = org.springframework.security.crypto.codec.Hex.decode(hexEncrypted);
        byte[] decryptedBytes = encryptor.decrypt(decodedBytes);
        String privateKeyHex = new String(decryptedBytes, StandardCharsets.UTF_8);
        if (privateKeyHex.startsWith("0x")) {
            privateKeyHex = privateKeyHex.substring(2);
        }
        System.out.println("Decrypted Private Key: " + privateKeyHex);
        
        ECKeyPair keyPair = ECKeyPair.create(new BigInteger(privateKeyHex, 16));
        String address = "0x" + Keys.getAddress(keyPair);
        System.out.println("Derived Address: " + address);
    }
}
