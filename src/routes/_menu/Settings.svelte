<script>
	import { browser } from '$app/environment';
	import { getContext, onMount, setContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { locale, t } from 'svelte-i18n';
	import OverlayScrollbars from 'overlayscrollbars';

	import { localConfig } from '$lib/store/localstore-manager';
	import { autoskip, wishAmount } from '$lib/store/app-stores';
	import { pauseSfx, playSfx } from '$lib/helpers/audio/audio';
	import { check as meteorCheck } from '$lib/helpers/meteor-loader';
	import factoryReset from '$lib/helpers/storage-reset';

	import Modal from '$lib/components/ModalTpl.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import OptionMenu from './_options.svelte';

	let optionToShow = '';
	const handleOption = (selected) => (optionToShow = selected);
	setContext('handleOption', handleOption);
	let isMuted = localConfig.get('muted');

	// const handleSelect = (option, e) => {
	// 	const { selected } = e.detail;
	// 	const optionValue = selected === 'yes';
	// 	localConfig.set(option, optionValue);
	// };

	// Handle Muted
	const handleMuted = ({ detail }) => {
		const { selected } = detail;
		isMuted = selected === 'yes';
		if (isMuted) pauseSfx('wishBacksound'); //stop sfx Before set config
		localConfig.set('muted', isMuted);
		if (!isMuted) playSfx('wishBacksound'); // Play SFX after set config
	};

	// AutoSkip
	const readyToPull = getContext('readyToPull');
	const handleAutoSkip = async ({ detail }) => {
		const { selected } = detail;
		const isAutoSkip = selected === 'yes';
		autoskip.set(isAutoSkip);
		localConfig.set('autoskip', isAutoSkip);
		if (isAutoSkip) return readyToPull.set(true);
		const cekExpress = await meteorCheck();
		readyToPull.set(cekExpress);
	};

	// Animated BG
	const handleAnimatedBG = getContext('animateBG');
	let animatedbg = browser ? !!localConfig.get('animatedBG') : false;
	const showAnimatedBG = (e) => {
		const { selected } = e.detail;
		localConfig.set('animatedBG', selected === 'yes');
		animatedbg = selected === 'yes';
		handleAnimatedBG();
	};

	// WishAmount
	let selectedAmount = localConfig.get('wishAmount') || 'default';
	const handleSelectAmount = ({ detail }) => {
		selectedAmount = detail;
		localConfig.set('wishAmount', detail);
		wishAmount.set(detail);
	};

	// Reset
	let showResetModal = false;
	let keepSetting = false;
	let clearCache = false;
	let showToast = false;
	let storageSize = '..B';

	const getSize = async () => {
		const { usage } = await navigator.storage.estimate();
		const size = (usage / 1000000).toFixed(2);
		storageSize = `${size}MB`;
	};

	const reset = () => {
		showResetModal = true;
		playSfx('modal');
	};
	setContext('factoryReset', reset);

	const confirmReset = async () => {
		playSfx();
		showResetModal = false;
		await factoryReset({ clearCache, keepSetting });
		showToast = true;
		if (keepSetting) return;

		playSfx('wishBacksound');
		handleAnimatedBG();
		selectedAmount = 'default';
	};

	const cancelReset = () => {
		showResetModal = false;
		playSfx('close');
	};

	let optionsContainer;
	onMount(() => {
		OverlayScrollbars(optionsContainer, { sizeAutoCapable: false, className: 'os-theme-light' });
		getSize();
	});
</script>

{#if showResetModal}
	<Modal title={$t('menu.resetTitle')} on:confirm={confirmReset} on:cancel={cancelReset}>
		<div class="confirmation">
			<div style="padding: 0 1rem">
				{@html $t('menu.resetPrompt')}

				<div class="checkbox keep-setting" style="margin-top: 5%;">
					<input
						type="checkbox"
						name="keepsetting"
						id="keepsetting"
						style="margin-right: 2%;"
						bind:checked={keepSetting}
						on:change={() => playSfx()}
					/>
					<label for="keepsetting">
						<i>✔</i>
						<span> {@html $t('menu.keepSetting')}</span>
					</label>
				</div>
				<div class="checkbox clear-cache">
					<input
						type="checkbox"
						name="cache"
						id="cache"
						style="margin-right: 2%;"
						bind:checked={clearCache}
						on:change={() => playSfx()}
					/>
					<label for="cache">
						<i>✔</i>
						<span>
							{@html $t('menu.clearCache', { values: { size: storageSize } })}
						</span>
					</label>
				</div>
			</div>
		</div>
	</Modal>
{/if}

{#if showToast}
	<Toast on:close={() => (showToast = false)}>{$t('menu.resetSuccess')}</Toast>
{/if}

<div in:fade={{ duration: 200 }} class="content-container" bind:this={optionsContainer}>
	<OptionMenu
		text={$t('menu.language')}
		name="locale"
		activeIndicator={$locale}
		showOption={optionToShow === 'locale'}
	/>

	<OptionMenu text={$t('menu.currency')} name="currency" showOption={optionToShow === 'currency'} />

	<OptionMenu
		name="wishAmount"
		text={$t('menu.fates')}
		showOption={optionToShow === 'wishAmount'}
		activeIndicator={selectedAmount}
		on:select={handleSelectAmount}
	/>

	{#each ['intertwined', 'acquaint', 'starglitter', 'stardust', 'primogem'] as item, i}
		{#if selectedAmount === 'manual'}
			<div in:fly|local={{ y: -10, delay: Math.sqrt(i * 10000) }} out:fly|local={{ y: -10 }}>
				<OptionMenu sub name={item} text={$t(`shop.item.${item}`)} />
			</div>
		{/if}
	{/each}

	<OptionMenu
		text={$t('menu.mute')}
		showOption={optionToShow === 'audio'}
		name="audio"
		activeIndicator={isMuted}
		on:select={handleMuted}
	/>

	<OptionMenu
		text={$t('menu.autoskip')}
		showOption={optionToShow === 'autoskip'}
		name="autoskip"
		activeIndicator={$autoskip}
		on:select={handleAutoSkip}
	/>

	<OptionMenu
		text={$t('menu.animatedbg')}
		showOption={optionToShow === 'animatedbg'}
		name="animatedbg"
		activeIndicator={animatedbg}
		on:select={showAnimatedBG}
	/>

	<OptionMenu name="switchBanner" text={$t('menu.switchBanner')} />

	<OptionMenu name="reset" text={$t('menu.factoryReset')} />

	<h2>Notes :</h2>
	<div class="notes">
		<ol>
			<li>
				I tried to create the simulator with pity system almost like the real game, the rate of
				getting rare item will increase once you reach a certain pity depending on where banner you
				pull. you can go <a
					on:click|stopPropagation
					href="https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator#pity-system"
					target="_blank"
					rel="noopener noreferrer"
				>
					Here
				</a>
				to find details of the probability. If you has any idea, please send me feedback by creating
				<a
					on:click|stopPropagation
					href="https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator/issues"
					target="_blank"
					rel="noopener noreferrer"
				>
					new issue here
				</a>
			</li>
			<li>
				This app use Localstorage and IndexedDB to save your pull history, it's native on your
				browser, if you clear your browser data, you will lost your data that related to this app
				too. No chance to recover it back, because we never store your data on cloud
			</li>
			<li>
				This App does not collect or store any personally identifiable information about you.
				However, this app use third party services that may collect information used to identify
				you. The information that these third party services request will be retained on your device
				and is not collected by me in any way.
			</li>
		</ol>
	</div>
</div>

<style>
	.confirmation {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.checkbox {
		font-size: 80%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 2% 0;
	}
	.checkbox label {
		width: 80%;
		text-align: left;
		display: flex;
		align-items: center;
	}
	.checkbox :global(small) {
		display: block;
	}

	.checkbox input + label i {
		color: white;
		border: 1px solid #aaa;
		display: inline-block;
		width: 1rem;
		aspect-ratio: 1/1;
		line-height: 1rem;
		margin-right: 2%;
		background-color: #fff;
		transition: all 0.2s;
	}
	.checkbox input:checked + label i {
		background-color: #06bbff;
	}

	.checkbox:hover input + label i {
		border: 1px solid #06bbff;
		box-shadow: rgba(106, 168, 230, 0.6) 0px 0px 7px 5px;
	}

	.checkbox input {
		display: none;
	}

	.notes {
		font-weight: 100;
		background-color: #fff;
		padding: 1rem 2.5rem 0.5rem;
		font-size: 0.87rem;
		border-radius: 0.3rem;
	}

	ol li {
		margin-bottom: 1rem;
	}
</style>
