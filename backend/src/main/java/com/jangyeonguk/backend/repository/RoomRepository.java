package com.jangyeonguk.backend.repository;

import com.jangyeonguk.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByRoomId(UUID roomId);
    List<Room> findAllByOrderByLastUpdatedAtDesc();
}

