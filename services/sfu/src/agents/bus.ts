import { EventEmitter } from 'events';
import type { AgentEvent } from './types.js';

/** Central intra-process bus for agent events. */
class AgentBus extends EventEmitter {
  broadcast(event: AgentEvent): void {
    this.emit('agentEvent', event);
  }
}

export const agentBus = new AgentBus();
