import { ReactiveController, ReactiveControllerHost } from "lit";

const log: string[] = [];
const instances = new Set<LogController>();
export const addLog = (str: string) => {
  console.log(str);
  log.push(str);
  instances.forEach((e) => e.host.requestUpdate());
};

export class LogController implements ReactiveController {
  host: ReactiveControllerHost;
  get value() {
    return log;
  }

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
    instances.add(this);
  }
  hostConnected() {}
  hostDisconnected() {
    instances.delete(this);
  }
}
