# Uldada

## [Install the userscript](https://raw.githubusercontent.com/hanenashi/uldada/main/uldada.user.js)

Uldada adds the [Ultra-dada creator²](https://yirkha.fud.cz/creators/ultradada2.php?n=3) to Okoun's **Neftipné creatory** club.

It is a small browser userscript for Tampermonkey, Violentmonkey, or a compatible userscript manager.

## What it does

1. Choose how many generated lines you want (2–30); the choice is remembered locally.
2. Select **Generate preview**.
3. Edit the generated text if you wish.
4. Select **Put into post field**.
5. Review the normal Okoun composer and submit the post yourself.

The script never submits a post. If the composer already contains text, it asks before replacing it.

## Install

1. Install a userscript manager, such as [Violentmonkey](https://violentmonkey.github.io/) or Tampermonkey.
2. Open the [direct install link](https://raw.githubusercontent.com/hanenashi/uldada/main/uldada.user.js) and confirm the installation.
3. Visit [Neftipné creatory](https://www.okoun.cz/boards/neftipne_creatory) while signed in.

The script only runs on that club's `www.okoun.cz` pages. It requests generated text from `yirkha.fud.cz`; it does not send your Okoun credentials or post automatically.

## Development

The complete script is [`uldada.user.js`](uldada.user.js). After editing it, reinstall or update it in your userscript manager.
