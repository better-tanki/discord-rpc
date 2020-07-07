/* Common */
type Nullable<T> = T | null;

/* Notification API */
export interface NotificationInfo {
	title: string;
	message: string;
	icon?: Nullable<string>;
	
	duration: number;

	titleColor?: string;
	messageColor?: string;
}

export interface NotificationAPI {
	create: (info: NotificationInfo) => number;
	edit: (id: number, info: NotificationInfo) => boolean;
	delete: (id: number) => boolean;
}

/* Menu API */
import { EventEmitter } from 'events';

export enum RootMenu {
	Unknown,
	Preload,
	CriticalError,
	Auth,
	MainMenu,
	PlayModes,
	Battle, BattlesList, BattleInfo, BattleCreate,
	Clan,
	Containers,
	Friends,
	Garage,
	GroupInvite,
	Missions,
	Settings,
	Shop
}

export enum ChildMenu {
	GarageWeapons, GarageHulls, GarageDrones, GarageResists, GaragePaints, GarageSupplies,
	SettingsGame, SettingsGraphics, SettingsSound, SettingsControls, SettingsAccount,
	MissionsSpecial, MissionsDaily, MissionsWeekly, MissionsChallenges,
	AuthLogin, AuthRegistration, AuthPasswordRecovery,
	FriendsList, FriendsRefferals, FriendsRequests,
	ClanInfo, ClanMembers,
	BattleCreateSettings,
	ContainersRewards,
	ShopItemInfo,
	News
}

export enum OverlayMenu {
	Loading,
	Chat
}

export type Menu = RootMenu | ChildMenu | OverlayMenu;

export class CurrentMenu {
	public root: RootMenu;
	public child: Nullable<ChildMenu>;
	public overlay: Nullable<OverlayMenu>;

	public constructor(root: RootMenu, child: Nullable<ChildMenu> = null, overlay: Nullable<OverlayMenu> = null) {
		this.root = root;
		this.child = child;
		this.overlay = overlay;
	}

	public array(): Nullable<Menu>[] {
		return [
			this.root,
			this.child,
			this.overlay
		];
	}

	public equals(other: CurrentMenu): boolean {
		return this.root === other.root && this.child === other.child && this.overlay === other.overlay;
	}
}

export interface MenuAPI {
	getCurrent: () => CurrentMenu;
	getFriendly: () => Nullable<string>[];
	emitter: EventEmitter;
}
