export namespace main {
	
	export class AppSettings {
	    theme: string;
	    fontSize: string;
	    blink: boolean;
	    language: string;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.fontSize = source["fontSize"];
	        this.blink = source["blink"];
	        this.language = source["language"];
	    }
	}
	export class StoredLayout {
	    dockview: any;
	    minimized: string[];
	    openPanels: string[];
	
	    static createFrom(source: any = {}) {
	        return new StoredLayout(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dockview = source["dockview"];
	        this.minimized = source["minimized"];
	        this.openPanels = source["openPanels"];
	    }
	}

}

export namespace mqtt {
	
	export class TlsConfig {
	    caCertPath?: string;
	    clientCertPath?: string;
	    clientKeyPath?: string;
	    allowInvalidCerts: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TlsConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.caCertPath = source["caCertPath"];
	        this.clientCertPath = source["clientCertPath"];
	        this.clientKeyPath = source["clientKeyPath"];
	        this.allowInvalidCerts = source["allowInvalidCerts"];
	    }
	}
	export class Subscription {
	    topic: string;
	    qos: number;
	
	    static createFrom(source: any = {}) {
	        return new Subscription(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic = source["topic"];
	        this.qos = source["qos"];
	    }
	}
	export class ConnectionConfig {
	    id: string;
	    name: string;
	    protocol: string;
	    host: string;
	    port: number;
	    wsPath?: string;
	    username?: string;
	    password?: string;
	    clientId?: string;
	    keepAliveSecs: number;
	    cleanSession: boolean;
	    subscriptions: Subscription[];
	    tls?: TlsConfig;
	    historyLimit: number;
	    connectOnStartup: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.protocol = source["protocol"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.wsPath = source["wsPath"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.clientId = source["clientId"];
	        this.keepAliveSecs = source["keepAliveSecs"];
	        this.cleanSession = source["cleanSession"];
	        this.subscriptions = this.convertValues(source["subscriptions"], Subscription);
	        this.tls = this.convertValues(source["tls"], TlsConfig);
	        this.historyLimit = source["historyLimit"];
	        this.connectOnStartup = source["connectOnStartup"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MessageRecord {
	    seq: number;
	    tsMs: number;
	    payloadB64: string;
	    payloadUtf8?: string;
	    qos: number;
	    retain: boolean;
	
	    static createFrom(source: any = {}) {
	        return new MessageRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.seq = source["seq"];
	        this.tsMs = source["tsMs"];
	        this.payloadB64 = source["payloadB64"];
	        this.payloadUtf8 = source["payloadUtf8"];
	        this.qos = source["qos"];
	        this.retain = source["retain"];
	    }
	}
	
	
	export class TopicDetails {
	    topic: string;
	    latest?: MessageRecord;
	    msgCount: number;
	    historyLen: number;
	
	    static createFrom(source: any = {}) {
	        return new TopicDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic = source["topic"];
	        this.latest = this.convertValues(source["latest"], MessageRecord);
	        this.msgCount = source["msgCount"];
	        this.historyLen = source["historyLen"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TopicUpdate {
	    topic: string;
	    preview: string;
	    msgCount: number;
	    lastTsMs: number;
	    retain: boolean;
	    numeric?: number;
	
	    static createFrom(source: any = {}) {
	        return new TopicUpdate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic = source["topic"];
	        this.preview = source["preview"];
	        this.msgCount = source["msgCount"];
	        this.lastTsMs = source["lastTsMs"];
	        this.retain = source["retain"];
	        this.numeric = source["numeric"];
	    }
	}

}

