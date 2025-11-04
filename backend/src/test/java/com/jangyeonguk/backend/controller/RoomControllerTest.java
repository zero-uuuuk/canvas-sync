package com.jangyeonguk.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jangyeonguk.backend.dto.RoomCreateRequest;
import com.jangyeonguk.backend.dto.RoomCreateResponse;
import com.jangyeonguk.backend.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import com.jangyeonguk.backend.dto.RoomResponse;
import com.jangyeonguk.backend.exception.RoomNotFoundException;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = RoomController.class, 
        excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomService roomService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public RoomService roomService() {
            return mock(RoomService.class);
        }
    }

    @Test
    @DisplayName("F-01a: 익명으로 새 캔버스(방) 생성 - title이 있는 경우")
    void createRoom_Anonymous_WithTitle_ShouldReturnCreated() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        String title = "내 캔버스";
        RoomCreateRequest request = RoomCreateRequest.builder()
                .title(title)
                .isAnonymous(true) // 익명 생성 (다른 참가자들에게 "익명"으로 표시)
                .build();

        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/rooms/" + roomId)
                .build();

        when(roomService.createRoom(any(RoomCreateRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/rooms/" + roomId));
    }

    @Test
    @DisplayName("F-01a: 익명으로 새 캔버스(방) 생성 - title이 없는 경우 (기본값 사용)")
    void createRoom_Anonymous_WithoutTitle_ShouldUseDefaultTitle() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/rooms/" + roomId)
                .build();

        when(roomService.createRoom(isNull())).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/rooms/" + roomId));
    }

    @Test
    @DisplayName("F-01a: 사용자로 새 캔버스(방) 생성 - title이 있는 경우")
    void createRoom_WithOwner_WithTitle_ShouldReturnCreated() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        String title = "사용자 캔버스";
        RoomCreateRequest request = RoomCreateRequest.builder()
                .title(title)
                .isAnonymous(false) // 사용자 생성 (익명 아님)
                .build();

        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/rooms/" + roomId)
                .build();

        when(roomService.createRoom(any(RoomCreateRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/rooms/" + roomId));
    }

    @Test
    @DisplayName("F-01a: 사용자로 새 캔버스(방) 생성 - title이 없는 경우 (기본값 사용)")
    void createRoom_WithOwner_WithoutTitle_ShouldUseDefaultTitle() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        RoomCreateRequest request = RoomCreateRequest.builder()
                .isAnonymous(false) // 사용자 생성 (익명 아님)
                .build();

        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/rooms/" + roomId)
                .build();

        when(roomService.createRoom(any(RoomCreateRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/rooms/" + roomId));
    }

    @Test
    @DisplayName("F-01b: 고유 URL로 캔버스 입장 - 성공 (사용자 방)")
    void getRoom_WithOwner_ShouldReturnRoomInfo() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        RoomResponse response = RoomResponse.builder()
                .roomId(roomId)
                .title("테스트 방")
                .ownerId(ownerId)
                .ownerName("테스트 사용자")
                .createdAt(now)
                .lastUpdatedAt(now)
                .build();

        when(roomService.getRoom(roomId)).thenReturn(response);

        // when & then
        mockMvc.perform(get("/api/rooms/{roomId}", roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.title").value("테스트 방"))
                .andExpect(jsonPath("$.ownerId").value(ownerId.toString()))
                .andExpect(jsonPath("$.ownerName").value("테스트 사용자"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.lastUpdatedAt").exists());
    }

    @Test
    @DisplayName("F-01b: 고유 URL로 캔버스 입장 - 성공 (익명 방)")
    void getRoom_Anonymous_ShouldReturnRoomInfo() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        RoomResponse response = RoomResponse.builder()
                .roomId(roomId)
                .title("익명 방")
                .ownerId(null)
                .ownerName("익명")
                .createdAt(now)
                .lastUpdatedAt(now)
                .build();

        when(roomService.getRoom(roomId)).thenReturn(response);

        // when & then
        mockMvc.perform(get("/api/rooms/{roomId}", roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.title").value("익명 방"))
                .andExpect(jsonPath("$.ownerId").isEmpty())
                .andExpect(jsonPath("$.ownerName").value("익명"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.lastUpdatedAt").exists());
    }

    @Test
    @DisplayName("F-01b: 고유 URL로 캔버스 입장 - 방을 찾을 수 없는 경우")
    void getRoom_WhenRoomNotFound_ShouldReturnNotFound() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();

        when(roomService.getRoom(roomId)).thenThrow(new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));

        // when & then
        mockMvc.perform(get("/api/rooms/{roomId}", roomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Room not found"))
                .andExpect(jsonPath("$.message").exists());
    }

}

