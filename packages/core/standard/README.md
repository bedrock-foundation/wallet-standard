# [WIP] Wallet Standard

This package outlines the Wallet Standard.

The purpose of this standard is to improve the user experience of wallets.

We intend for this standard to become broadly adopted by wallets and dapps.

This is an incomplete work in progress and is rapidly changing.

Wallet and dapp devs are encouraged to provide their feedback and have it integrated.

## Code

- [Global `window.navigator.wallets` interface](src/window.ts)
- [Wallet interface](src/wallet.ts)
- [Example of how Standard Wallets attach to the window](../../example/wallets/src/window.ts)

## Design Principles and Goals

### This standard applies to "injected" wallets only

This standard is designed for wallets that run in browser extensions or embedded webviews and attach themselves to the global `window` object.

Wallets that require a dapp to load libraries or open popup windows cannot be detected in the same way.

While these other wallets should attempt to have generally compatible interfaces, we do not design specifically for them here.

We should design for maximum compatibility across this standard, the SMS mobile wallet adapter, and Wallet Adapter.

Consistent, compatible interfaces will reduce the maintenance burden of wallets and dapps.

```diff
+ One additional inconsistency I've encountered is how injected wallets handle 
+ loading into iframes that are also injected into a dapp. By default, iframes 
+ should be able to communicate with their parent window object, but some wallets
+ explicitly disallow this security reasons. It would be great if this specification 
+ defined how wallets should interact with iframes. The use-case is fairly straight 
+ forward: on a checkout page an ecommerce store may load an iframe to handle the 
+ actual transfer of funds from customer to merchant. 
```

### Wallet Adapter (and other libraries) will still be used by dapps

Many dapps use Wallet Adapter to maximize their support for wallets and for state management.

Some popular wallets are not attached to the window, so Wallet Adapter will still be needed.

Wallet Adapter will support and integrate this standard, and dapps will be encouraged to update.

Dapps should be able to update Wallet Adapter to support this standard without significant changes to dependencies or code.

No breaking changes is the goal. Wallet Adapter should abstract changes and deprecate current APIs as needed.

### Present a predictable interface for wallets to attach to the window

When a dapp loads, it should detect all wallets that have already attached themselves to the window.

After loading, a dapp should always detect any new wallet immediately when it attaches itself to the window.

```diff
+ What is the usecase for a wallet attaching itself to the window after the page has already loaded?
```

A dapp should have no special logic for detecting any specific wallet.

It should be impossible for conflicts between individual wallet browser extensions to prevent any wallet from being detected.

### `window.navigator.wallets` is the namespace of the global interface

`window.ethereum` has traditionally been used by injected wallets like Metamask. This convention causes multiple wallets to conflict for access to a global variable.

Browser extension wallets have adapted to this by using `Object.defineProperty(window, 'ethereum', { writable: false, ... })` to race to be the first to claim it.

This makes it impossible for multiple wallets a user has to coexist, or be detected reliably by dapps. Several existing wallets use `window.solana` to do the same thing.

Wallet Adapter has been doing its part to discourage use of this for the last year by consistently not accepting new adapters that use `window.solana`.

While wallets should continue to migrate away from using `window.solana`, this standard will not conflict with this, and will instead present a chain-agnostic interface.

Because `window.wallets` may be in use by websites, and because wallets may be built into browsers themselves, we will extend the [Navigator](https://developer.mozilla.org/en-US/docs/Web/API/Navigator) interface instead.
`Navigator feels like a natural place to store this interface, good call.`

### Present a chain-agnostic interface

TODO: docs

### Decouple the state of the wallet UI from the state of the dapp UI

Wallets should be presented as stateless, isolated, multi-tenant applications to dapps.

When a dapp acts upon a wallet, it should have no effect on any other dapp that may interact with the wallet.

Similarly, when a user interacts with the wallet UI, it should have no effect on any dapp.

```diff
+ This pushes account selection to the dapp instead of 
+ requiring the user to switch accounts within the wallet. 
+ I'm assuming wallet adapter will provide an easily embeddable UI for this.`
```

When a user changes accounts or networks in the wallet UI, their intent is to see their assets or act with them in the context of the wallet UI.

After a dapp has connected to a wallet and discovered an account, the dapp should be able to request to sign using that account specifically.

When this occurs, the wallet should display account and network changes to sign and send transactions for the dapp, and then return to its previous context.

```diff 
+ Currently in most browser extension wallets it is possible for a user to 
+ have multiple accounts but only a single account selected at a time. When 
+ the selected account is switched to a different account in the wallet UI, 
+ the new account remains selected for all dapps until a different account is selected. 
+ Allowing a dapp to request a signature from an account that is currently 
+ not selected is a great idea but may confuse some users as it is a departure 
+ from the current behavior. Some wallet UI's will be to modified to clearly 
+ highlight which account is being acted upon.
```

### Standardize feature support

Wallets inconsistently support signing and sending transactions, signing more than one transaction, signing a "message" (arbitrary byte array), and encryption and decryption.

To the extent they support these, they have different interfaces for them, and many wallets have behaviors that are not secure.

This standard will cover support for

- signing one or more transactions
- signing and sending one or more transactions
- signing one or more "messages" (arbitrary byte arrays)
- encryption and decryption

### No web3.js dependency

The standard does not depend on `@solana/web3.js` or use it in its implementation.

web3.js is large and class-based, has many dependencies, and is likely to be substantially rewritten.

Some wallets don't use web3.js to minimize the security surface of their code.

The interface in the standard will always input and output transactions, pubkeys, and signatures as raw bytes (`Uint8Array`).
```diff
+ This is great. I'm curious how the type annotations for these Uint8Array's 
+ can be communicated as to inform developers that a value can be converted 
+ to a transaction, PublicKey, etc outside of wallet adapter.
```

Wallet Adapter will encode these as web3.js `Transaction`, `PublicKey`, and Base58 strings as needed for compatibility with dapps.

### Network is used for simulation

When signing a transaction (not just when signing and sending), a network parameter should be provided.

The recent blockhash of the transaction should be valid for the cluster, and simulation should succeed.

Wallets should treat failed simulation of transactions as a security issue and avoid returning signed transactions.

Signing and sending from the wallet should still be the preferred interface, for security.
```diff
+ What are the security implications of signing with the wallet and sending outside the wallet?
```

### APIs should be versioned

The API for window objects and the API for wallets should both be versioned semantically.

Dapps should be able to detect available features based on known API versions.
```diff
+ Where is information on version to feature availability stored for dapp developers?
```

Multiple versions should be able to coexist to the greatest extent possible.

### API methods should handle multiple inputs

`doThing` and `doAllThings` is an antipattern.

Methods should accept arrays rather than singular objects wherever it makes sense.

Wallets can choose to not support multiple inputs by throwing an error.

This is consistent with the SMS mobile wallet adapter SDK design.

Wallet Adapter will abstract over this interface to avoid breaking changes, while deprecating its current API.

### API methods treat data as immutable

Readonly bytes and primitive types should be the only inputs and outputs.

Wallets must not modify `Uint8Array` instances. Copy on write and return the copy.

### Partial signatures and meta-transactions should be supported

Browser extensions that use programs and relayers for multisig and paying transaction fees for users must be supported.

In practice, this just means that transaction signing interfaces must return serialized transaction objects, not just signatures.

Because API data is immutable, this should be a natural default.

### Multiple accounts should be supported

With the user's permission, dapps should be able to discover multiple accounts in the wallet.
```diff
+ Allowing dapps to see all of a users accounts has the side-effect of 
+ enabling dapps to easily associate multiple accounts with a single user. This 
+ could be used as a gate to dissallow accounts owned by the same person 
+ from taking certain actions. Some users may not want a dapp to see all their accounts. 
+ Probably not a real concern, but something to note. 
```

Wallets need a way for accounts to be securely enumerated, and inform dapps when there are accounts it doesn't know about.
```diff 
It would be great if wallet-adapter provided UI around notifying dapps of newly created or imported wallets so devs don't have to deal with all the nuance of building UI around this.
```

### Wallets embed their own interface and metadata

Wallet names and icons should be provided by the wallet.

Image files should be encoded with data URLs to avoid extra HTTP load.

### Errors should be predictable

There should be standard error codes for known failure conditions.
```diff
It would be great to have document enumerating these errors and failure conditions. 
```

### Provide a reference implementation

A browser extension wallet that implements minimal functionality should be created.
```diff
+ I would be happy to help with this.
```

This will act as a reference implementation and let us test the practicability of the design.

A dapp that implements limited functionality should also be created.
```diff 
+ I would be happy to help with this also.
```

This will let us determine whether any breaking changes to Wallet Adapter are required.
