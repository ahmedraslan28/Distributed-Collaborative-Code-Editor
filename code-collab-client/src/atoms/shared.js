import { atom } from "jotai";

export const codeAtom = atom('');
export const languageAtom = atom('javascript');
export const inputAtom = atom('');
export const outputAtom = atom([]);
export const chatMessagesAtom = atom([]);
export const buttonStatusAtom = atom('Run Code');
export const isLoadingAtom = atom(false);