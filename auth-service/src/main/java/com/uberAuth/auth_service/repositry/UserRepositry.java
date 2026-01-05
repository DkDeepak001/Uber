package com.uberAuth.auth_service.repositry;

import com.uber.entity.models.Users;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepositry extends JpaRepository<Users,Long> {
    Optional<Users> findByEmail(String email);
}
