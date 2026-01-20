package com.sj.Workly.repository;

import com.sj.Workly.entity.OrgMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrgMemberRepository extends JpaRepository<OrgMember, Long> {
    List<OrgMember> findByOrgId(Long orgId);
    List<OrgMember> findByUserId(Long userId);
    Optional<OrgMember> findByOrgIdAndUserId(Long orgId, Long userId);
    boolean existsByOrgIdAndUserId(Long orgId, Long userId);
    boolean existsByOrgIdAndUserEmail(Long orgId, String email);

}
