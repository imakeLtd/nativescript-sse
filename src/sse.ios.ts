import { fromObject, Observable } from '@nativescript/core';
import { BaseSSE } from './sse.common';
declare const WeakRef, IKEventSource;
export class SSE extends BaseSSE {
  private _headers: NSDictionary<any, any>;
  private _url: NSURL;
  private _es: any;
  public events: Observable;
  private lastEventId: string;
  constructor(url: string, headers: any = {}) {
    super(url, headers);
    this.events = fromObject({});
    this._url = NSURL.alloc().initWithString(url);
    this._headers = NSDictionary.alloc().initWithDictionary(headers);
    this._es = IKEventSource.alloc().initWithUrlHeaders(this._url, this._headers);
    const ref = new WeakRef(this);
    const owner = ref.get();
    this._es.onMessage((id, event, data) => {
      this.lastEventId = id;
      owner.events.notify({
        eventName: 'onMessage',
        object: {
          event: event,
          data
        }
      });
    });
    this._es.onError(err => {
      owner.events.notify({
        eventName: 'onError',
        object: {
          error: err.localizedDescription
        }
      });
    });
    this._es.onOpen(() => {
      owner.events.notify({
        eventName: 'onConnect',
        object: {
          connected: true
        }
      });
    });
    this.connect();
  }
  public addEventListener(event: string): void {
    if (!this._es) return;
    const ref = new WeakRef(this);
    const owner = ref.get();
    this._es.addEventListenerHandler(event, (id, event, data) => {
      owner.events.notify({
        eventName: 'onMessage',
        object: {
          event: event,
          data
        }
      });
    });
  }
  public removeEventListener(event: string): void {
    if (!this._es) return;
    this._es.removeEventListener(event);
  }
  public connect(): void {
    if (!this._es) return;
    this._es.connectWithLastEventId("");
  }
  public close(): void {
    if (!this._es) return;
    this._es.disconnect();
  }
}
