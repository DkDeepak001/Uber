package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.UserDto;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.expiry}")
    private int exipration;

    @Value("${jwt.secret}")
    private String SECRET;

    public String generatTokenString(Map<String,Object> payload){
        Date now = new Date();
        Date expiration = new Date(now.getTime() + exipration * 1000);
        return Jwts.builder()
                .setClaims(payload)
                .setExpiration(expiration)
                .signWith(getSecurutyKey())
                .compact();
    }
    public Key getSecurutyKey(){
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

}
