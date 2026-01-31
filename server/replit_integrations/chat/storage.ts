export interface ChatConversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

class InMemoryChatStorage {
  private conversations: Map<number, ChatConversation> = new Map();
  private messages: Map<number, ChatMessage> = new Map();
  private nextConversationId = 1;
  private nextMessageId = 1;

  async getConversation(id: number): Promise<ChatConversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createConversation(title: string): Promise<ChatConversation> {
    const conversation: ChatConversation = {
      id: this.nextConversationId++,
      title,
      createdAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    for (const [msgId, msg] of this.messages.entries()) {
      if (msg.conversationId === id) {
        this.messages.delete(msgId);
      }
    }
  }

  async getMessagesByConversation(conversationId: number): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: this.nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }
}

export const chatStorage = new InMemoryChatStorage();
