
// Mock implementation of Base44 SDK

const mockStore: any = {
  avatars: [],
  sessions: [],
  messages: [
    { id: 'm1', sender: 'System', content: 'Welcome to SpectroVerse!', timestamp: Date.now() }
  ],
  users: [
    { id: 'u2', name: 'Alice_Researcher', status: 'online' },
    { id: 'u3', name: 'Bob_Engineer', status: 'busy' }
  ]
};

// Simple Event Emitter for Live Updates
const listeners: any = {};

export const base44 = {
  auth: {
    me: async () => {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 500));
      return { id: 'user_123', email: 'demo@spectroverse.ai', role: 'admin', name: 'SpectroUser' };
    },
    logout: async () => {
      console.log('Logged out');
    }
  },
  social: {
    chat: {
      send: async (content: string) => {
        const msg = { 
          id: `m_${Date.now()}`, 
          sender: 'You', 
          content, 
          timestamp: Date.now() 
        };
        mockStore.messages.push(msg);
        return msg;
      },
      history: async () => {
        return [...mockStore.messages];
      }
    },
    friends: {
      list: async () => {
        return [...mockStore.users];
      }
    }
  },
  entities: {
    AvatarCustomization: {
      list: async (sort: string, limit: number) => {
        return [...mockStore.avatars].slice(0, limit);
      },
      create: async (data: any) => {
        const newItem = { id: `avt_${Date.now()}`, ...data, created_date: new Date().toISOString() };
        mockStore.avatars.unshift(newItem);
        // Emit update event
        if(listeners['avatar.created']) listeners['avatar.created'].forEach((cb:any) => cb(newItem));
        return newItem;
      }
    },
    MusicAnalysis: {
      list: async () => {
        return [];
      }
    },
    SceneSession: {
      update: async (id: string, data: any) => {
        console.log('Updating session', id, data);
        return { id, ...data };
      }
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }: { prompt: string }) => {
        await new Promise(r => setTimeout(r, 1000));
        console.log("LLM invoked:", prompt);
        
        // Return structured mock data if requested, otherwise simple text
        if (prompt.includes("scene director")) {
            return {
                overall_assessment: "good",
                performance_score: 85,
                lod_suggestions: { adjustment_needed: true, recommended_distances: [10, 30, 80] },
                physics_suggestions: { complexity_adjustment: "maintain" },
                animation_choreography: [],
                environment_suggestions: [{ type: "lighting", suggestion: "Increase ambient light", performance_cost: "low" }],
                critical_actions: []
            };
        }

        return "I am the AI assistant. I have processed your request.";
      }
    }
  },
  events: {
      on: (event: string, cb: Function) => {
          if(!listeners[event]) listeners[event] = [];
          listeners[event].push(cb);
      },
      off: (event: string, cb: Function) => {
          if(!listeners[event]) return;
          listeners[event] = listeners[event].filter((c:any) => c !== cb);
      },
      emit: (event: string, data: any) => {
          if(listeners[event]) listeners[event].forEach((cb:any) => cb(data));
      }
  }
};
