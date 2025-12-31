package com.uberAuth.auth_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

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
                .setIssuedAt(now)
                .signWith(getSecurutyKey())
                .compact();
    }

    public <T> T extractAllPayload(String token, Function<Claims,T> claimsTFunction){
       Claims claims = Jwts.parserBuilder().setSigningKey(getSecurutyKey()).build().parseClaimsJws(token).getBody();
        System.out.println(claims.toString());
       return claimsTFunction.apply(claims);
    }

    public String extractEmail(String token){
        return extractAllPayload(token,claims -> claims.get("email",String.class));
    }
    public String extractId(String token){
        return extractAllPayload(token,claims -> claims.get("Id",String.class));
    }
    public Date extractExpritation(String token){
        return extractAllPayload(token, Claims::getExpiration);
    }

    public Boolean isValid(String token){
        return extractExpritation(token).before(new Date());
    }

    public Key getSecurutyKey(){
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

}
