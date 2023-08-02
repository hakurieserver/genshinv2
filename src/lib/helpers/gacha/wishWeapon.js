// import { fatePoint, selectedCourse } from '$lib/store/stores';
import { course } from '$lib/store/app-stores';
import { fatepointManager, guaranteedStatus } from '$lib/store/localstore-manager';
import { rand, get3StarItem, get4StarItem, get5StarItem } from './itemdrop-base';
import { prob } from './probabilities';

const fatepoint = {
	init({ version, phase, featured, fatesystemON }) {
		this._fatesystemON = fatesystemON;
		if (!fatesystemON) return null;
		this._featured = featured;
		this._fatepointManager = fatepointManager.init({ version, phase });
		return this;
	},

	check() {
		this._info = this._fatepointManager.getInfo();
		return this._info;
	},

	verify(result) {
		if (!this._fatesystemON) return null;
		const { _featured, _info, _fatepointManager } = this;
		const { selected, point } = _info;
		if (selected === null) return false;

		const { name: resultName } = result;
		const { name: selectedWeapon } = _featured[selected];

		// Reset Fatepoint
		if (resultName === selectedWeapon) {
			_fatepointManager.remove();
			course.set({ point: 0, selected: null });
			return point === 2;
		}

		// Update Fatepoint if not a selected item
		_fatepointManager.set(point + 1, selected);
		course.set({ point: point + 1, selected });
		return false;
	}
};

const isRateup = () => {
	const item = [
		{ type: 'rateup', chance: 75 },
		{ type: 'std', chance: 25 }
	];
	const { type } = prob(item);
	return type === 'rateup';
};

const weaponWish = {
	init({ rateup, version, phase, featured, fatesystemON } = {}) {
		this._version = version;
		this._phase = phase;
		this._rateup = rateup;
		this._featured = featured;

		this._fatesystem = fatepoint.init({ version, phase, featured, fatesystemON });
		return this;
	},

	get(rarity) {
		// 3 star items
		if (rarity === 3) {
			const droplist = get3StarItem();
			return rand(droplist);
		}

		// 4 star items (Character or Weapon)
		if (rarity === 4) {
			const { _version: version, _phase: phase, _rateup: rateup } = this;
			const isGuaranteed = guaranteedStatus.get('weapon-event-4star');
			const useRateup = isGuaranteed || isRateup();

			const droplist = get4StarItem({
				banner: 'weapon-event',
				rateupNamelist: rateup,
				useRateup,
				version,
				phase
			});

			guaranteedStatus.set('weapon-event-4star', !useRateup);
			return rand(droplist);
		}

		// 5 Star Weapon
		if (rarity === 5) {
			const { _featured, _fatesystem } = this;
			const isGuaranteed = guaranteedStatus.get('weapon-event-5star');
			let useRateup = isGuaranteed || isRateup();

			let calculateFatepoint = false;
			let rateupItem = _featured.map(({ name }) => name);
			if (_fatesystem) {
				const { selected, point } = _fatesystem.check();
				calculateFatepoint = selected !== null && selected > -1;
				// Guaranteed after 2 point
				if (calculateFatepoint && point >= 2) {
					useRateup = true;
					rateupItem = [rateupItem[selected]];
				}
			}

			const droplist = get5StarItem({
				banner: 'weapon-event',
				rateupItem,
				useRateup
			});

			const result = rand(droplist);
			const isFatepointFull = _fatesystem?.verify(result);

			const rateUpStatus = isGuaranteed ? 'guaranteed' : 'win';
			const fatepointstatus = calculateFatepoint && isFatepointFull ? 'selected' : rateUpStatus;
			const status = useRateup ? fatepointstatus : 'lose';
			guaranteedStatus.set('weapon-event-5star', !useRateup);

			return { ...result, status };
		}
	}
};

export default weaponWish;
