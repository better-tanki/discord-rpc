import * as DiscordRPC from 'discord-rpc';
import * as XRegExp from 'xregexp';

import { Plugin, Nullable } from '../../plugin-api';
import { DiscordRichPresenceAPI } from './api';
import {
	NotificationAPI,
	MenuAPI, CurrentMenu, RootMenu, ChildMenu
} from './api-imports';

interface PresenceImage {
	key: string;
	text?: string;
}

interface Presence {
	details?: string;
	state?: string;
	startTime?: number | Date;
	endTime?: number | Date;
	largeImage?: PresenceImage;
	smallImage?: PresenceImage;
	instance?: boolean;
}

declare module 'discord-rpc' {
	interface Presence {
		partyId?: string;
	}
}

type Snowflake = string;
class RichPresence {
	private clientId: Snowflake;
	private client: DiscordRPC.Client;

	public constructor() {
		this.clientId = '707949124724457502';
		
		DiscordRPC.register(this.clientId);
		this.client = new DiscordRPC.Client({
			transport: 'ipc'
		});
		
		this.client.on('ready', () => {
			console.log(`User: ${this.client.user.username}#${this.client.user.discriminator}`);
		});
	}

	async login() {
		return this.client.login({
			clientId: this.clientId
		}).then(() => {
			console.log(`[RPC] Logged in`);
		}).catch((error: Error) => {
			console.error(error);

			(window.BetterTanki.PluginAPI.get('notification-api')?.api as NotificationAPI).create({
				title: 'Ошибка Discord Rich Presence',
				message: `${error.name}: ${error.message}`,
				duration: 10000,
				titleColor: '#f51212'
			});
		});
	}

	async setActivity(presence: Presence) {
		const {
			details, state,
			startTime, endTime,
			largeImage, smallImage,
			instance = false
		}: Presence = presence;

		//console.log(`[RPC] [Debug] Set activity: [ ${details}, ${state} ]`);

		if(!this.client.user) return false;

		return this.client.setActivity({
			details: details,
			state: state,
			startTimestamp: startTime,
			endTimestamp: endTime,
			largeImageKey: largeImage?.key || 'logo',
			largeImageText: largeImage?.text,
			smallImageKey: smallImage?.key || 'logo_legacy',
			smallImageText: smallImage?.text || 'Tanki Online',
			instance: instance
		}).catch((error: Error) => {
			console.error(error);

			(window.BetterTanki.PluginAPI.get('notification-api')?.api as NotificationAPI).create({
				title: 'Ошибка Discord Rich Presence',
				message: `${error.name}: ${error.message}`,
				duration: 10000,
				titleColor: '#f51212'
			});
		});
	}
}

interface UserInformation {
	username?: string;
	clan?: Nullable<string>;
	rank?: string;
}

class StatusManager {
	private constructor() {

	}

	public static extended(presence: Presence, info: UserInformation): Presence {
		return {
			...presence,
			largeImage: {
				key: 'logo',
				text: info.username && info.rank ? `${info.rank} | ${info.clan ? `[${info.clan}] ` : ''}${info.username}` : undefined
			}
		};
	}

	public static for(menu: CurrentMenu): Nullable<Presence> {
		switch(menu.root) {
			case RootMenu.Preload: return {
				details: 'Загрузка...'
			}

			case RootMenu.Auth: switch(menu.child) {
				case ChildMenu.AuthLogin: return {
					details: 'Авторизация'
				};

				case ChildMenu.AuthRegistration: return {
					details: 'Регистрация'
				};
			}

			case RootMenu.MainMenu: return {
				details: 'В главном меню'
			}

			case RootMenu.PlayModes: return {
				details: 'В списке режимов'
			}

			case RootMenu.BattlesList: return {
				details: 'В списке битв'
			}
			
			case RootMenu.Battle: return {
				details: 'В битве'
			}

			case RootMenu.Settings: return {
				details: 'В настройках'
			}

			case RootMenu.Containers: return {
				details: 'Открывает контейнеры'
			}

			case RootMenu.Friends: return {
				details: 'В списке друзей'
			}

			case RootMenu.Missions: return {
				details: 'В списке заданий'
			}

			case RootMenu.Shop: return {
				details: 'В магазине'
			}

			case RootMenu.Garage: return {
				details: 'В гараже'
			}

			case RootMenu.Clan: return {
				details: 'В информации о клане'
			}

			case RootMenu.CriticalError: return {
				details: 'Критическая ошибка'
			}
		}
		return null;
	}
}

//@ts-ignore TODO
window.StatusManager = StatusManager;

export default class extends Plugin {
	private rpc: RichPresence;
	private info: UserInformation;

	public api: DiscordRichPresenceAPI;

	public constructor() {
		super({
			id: 'discord-rpc',
			name: 'Discord Rich Presence',
			description: null,
			version: '1.0.0',
			author: 'Assasans'
		});

		this.rpc = new RichPresence();
		this.info = {};

		this.api = {
		};
	}

	public async load(): Promise<void> {
		const $ = await import('jquery');

		XRegExp.install({
			namespacing: true
		});

		await this.rpc.login();

		(window.BetterTanki.PluginAPI.get('menu-api')?.api as MenuAPI).emitter.on('menuChange', (menu: CurrentMenu) => {
			if(menu.root === RootMenu.MainMenu) {
				let { rank, clan, username }: {
					rank?: string,
					clan?: string,
					username?: string
				} = XRegExp.exec(
					$('span[data-style="UserInfoContainerStyle-userNameRank"]').text(),
					XRegExp('(?<rank>.+)(?:\\s\\|\\s)(?:\\[(?<clan>.+)\\]\\s)?(?<username>.+)')
				)?.groups || {};

				if(username) this.info.username = username;
				if(clan) this.info.clan = clan;
				if(rank) this.info.rank = rank;
			}

			console.log((window.BetterTanki.PluginAPI.get('menu-api')?.api as MenuAPI).getFriendly());
			const presence: Nullable<Presence> = StatusManager.for(menu);
			if(presence) {
				this.rpc.setActivity(StatusManager.extended(presence, this.info));
			}
		});

		//$('head').append($(`<link href="${__dirname}/../css/discord-rpc.css" rel="stylesheet">`));
		
		this.api = {
		};
	}

	public async start(): Promise<void> {
	}
}
