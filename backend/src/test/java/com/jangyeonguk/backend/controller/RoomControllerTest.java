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
import static org.mockito.ArgumentMatchers.eq;
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
    @DisplayName("F-01a (1): 익명으로 새 캔버스(방) 생성 - title이 있는 경우")
    void createRoom_WithTitle_ShouldReturnCreated() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        String title = "내 캔버스";
        RoomCreateRequest request = RoomCreateRequest.builder()
                .title(title)
                .build();

        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/room/" + roomId)
                .build();

        when(roomService.createRoom(any(RoomCreateRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/room/" + roomId));
    }

    @Test
    @DisplayName("F-01a (1): 익명으로 새 캔버스(방) 생성 - title이 없는 경우 (기본값 사용)")
    void createRoom_WithoutTitle_ShouldUseDefaultTitle() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/room/" + roomId)
                .build();

        when(roomService.createRoom(isNull())).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/room/" + roomId));
    }

    @Test
    @DisplayName("F-01a (2): 사용자로 새 캔버스(방) 생성 - title이 있는 경우")
    void createRoomWithOwner_WithTitle_ShouldReturnCreated() throws Exception {
        // given
        UUID ownerId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        String title = "사용자 캔버스";
        RoomCreateRequest request = RoomCreateRequest.builder()
                .title(title)
                .build();

        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/room/" + roomId)
                .build();

        when(roomService.createRoom(any(RoomCreateRequest.class), eq(ownerId))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms/user/{ownerId}", ownerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/room/" + roomId));
    }

    @Test
    @DisplayName("F-01a (2): 사용자로 새 캔버스(방) 생성 - title이 없는 경우 (기본값 사용)")
    void createRoomWithOwner_WithoutTitle_ShouldUseDefaultTitle() throws Exception {
        // given
        UUID ownerId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        RoomCreateResponse response = RoomCreateResponse.builder()
                .roomId(roomId)
                .roomUrl("/room/" + roomId)
                .build();

        when(roomService.createRoom(isNull(), eq(ownerId))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/rooms/user/{ownerId}", ownerId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId").value(roomId.toString()))
                .andExpect(jsonPath("$.roomUrl").value("/room/" + roomId));
    }

    @Test
    @DisplayName("F-01b: 고유 URL로 캔버스 입장 - 성공")
    void getRoom_ShouldReturnRoomInfo() throws Exception {
        // given
        UUID roomId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        RoomResponse response = RoomResponse.builder()
                .roomId(roomId)
                .title("테스트 방")
                .ownerId(ownerId)
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

