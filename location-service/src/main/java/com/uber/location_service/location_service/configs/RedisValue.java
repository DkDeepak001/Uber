package com.uber.location_service.location_service.configs;

import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@AllArgsConstructor
public class RedisValue {
    private StringRedisTemplate redis;

    public StringRedisTemplate getStringRedisTemplate(){
        return redis;
    }

    public void set(String key, String value) {
        redis.opsForValue().set(key, value);
    }

    public void setWithTtl(String key, String value, Duration ttl) {
        redis.opsForValue().set(key, value, ttl);
    }

    public String get(String key) {
        return redis.opsForValue().get(key);
    }

    public void delete(String key) {
        redis.delete(key);
    }
}
