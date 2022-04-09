import { PublicKey } from "@solana/web3.js";
//import "dotenv/config";

//const SHOP_PUBLIC_ADDRESS= process.env.SHOP_PUBLIC_KEY as string;
//const SHOP_COUPON_ADDRESS = process.env.SHOP_COUPON_KEY as string;

// public key is your wallet address

// solana libraries need these address, so we are using in the way they want it

export const shopAddress = new PublicKey('AWA1hK1T2ntHP7hQwc1SUXFTFWCJ52Qxtsa1xFrqcJB6'); // my shop address, will be using this public address of ours in different places

export const usdcAddress = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr') // will be same for everyone, this is token address

export const couponAddress = new PublicKey('9LXSJSnLKpMxjoGEzUe6fdeAMwQec9wF9VXLCdQmoxog'); // this is coupon address

// public key is just used for address.