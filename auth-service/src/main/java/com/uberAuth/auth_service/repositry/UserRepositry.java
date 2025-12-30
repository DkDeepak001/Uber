package com.uberAuth.auth_service.repositry;

import com.uberAuth.auth_service.models.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepositry extends JpaRepository<Users,Long> {
}
