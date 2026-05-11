package com.realty_app.chat_service.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReadReceiptResponse {
    private Long conversationId;
    private Long readerId;
    private List<Long> messageIds;
}
