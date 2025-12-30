package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.UserDto;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
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

    public String generatTokenString(UserDto userDto){
        Map<String,Object> payload = new HashMap<>();
        payload.put("email",userDto.getEmail());
        payload.put("id",userDto.getId());
        Date now = new Date();
        Date expiration = new Date(now.getTime() + exipration * 1000);
        return Jwts.builder()
                .setClaims(payload)
                .setExpiration(expiration)
                .signWith(getSecurutyKey())
                .compact();
    }
    public Key getSecurutyKey(){
        return Keys.hmacShaKeyFor(Decoders.BASE64URL.decode(SECRET));
    }

}
