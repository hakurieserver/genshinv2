import { guaranteedStatus } from '$lib/store/localstore-manager';
import { get3StarItem, get4StarItem, rand, get5StarItem } from './itemdrop-base';

const characterWish = {
	init({ indexOfBanner, featured, rateup, version, phase, stdver }) {
		this._featured = featured;
		this._rateup = rateup;
		this._indexOfBanner = indexOfBanner;
		this._version = version;
		this._phase = phase;
		this._stdver = stdver;
		return this;
	},

	get(rarity) {
		const isRateup = () => rand(['rateup', 'std']) === 'rateup';

		if (rarity === 3) {
			const droplist = get3StarItem();
			return rand(droplist);
		}

		if (rarity === 4) {
			const { _version: version, _phase: phase, _rateup: rateup } = this;
			const isGuaranteed = guaranteedStatus.get('character-event-4star');
			const useRateup = isGuaranteed || isRateup();

			const droplist = get4StarItem({
				banner: 'character-event',
				rateupNamelist: rateup,
				useRateup,
				version,
				phase
			});

			guaranteedStatus.set('character-event-4star', !useRateup);
			return rand(droplist);
		}

		if (rarity === 5) {
			const { _featured, _indexOfBanner, _stdver } = this;
			const isGuaranteed = guaranteedStatus.get('character-event-5star');
			const useRateup = isGuaranteed || isRateup();

			const droplist = get5StarItem({
				banner: 'character-event',
				stdver: _stdver,
				rateupItem: [_featured[_indexOfBanner].character],
				useRateup
			});
			const result = rand(droplist);

			const rateUpStatus = isGuaranteed ? 'guaranteed' : 'win';
			const status = useRateup ? rateUpStatus : 'lose';
			guaranteedStatus.set('character-event-5star', !useRateup);
			return { ...result, status };
		}
	}
};

export default characterWish;
