package com.sj.Workly.repository;

import com.sj.Workly.entity.Invite;
import com.sj.Workly.entity.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, Long> {
    Optional<Invite> findByToken(String token);
    List<Invite> findByOrgIdOrderByCreatedAtDesc(Long orgId);
    boolean existsByOrgIdAndInvitedEmailAndStatus(Long orgId, String invitedEmail, InviteStatus status);
}
