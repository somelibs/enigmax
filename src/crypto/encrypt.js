import _ from 'lodash';
import { pack } from 'utf8-buffer';
import arrayBufferToHex from 'array-buffer-to-hex';
import stringToInitVector from '../utils/stringToInitVector';
import Random from '../core/Random';

const getCryptoKey = (key) => {
  if (key && _.isFunction(key.toCryptoKey)) {
    return key.toCryptoKey();
  }
};

const stringToArrayBuffer = (string) => {
  const buffer = [];
  pack(string, buffer);
  return new Uint8Array(buffer);
};

const encrypt = async (payload, { key, raw = false }) => {
  try {
    let settings;
    let ivString;
    const cryptoKey = getCryptoKey(key);
    const buffer = (_.isArrayBuffer(payload) || raw) ? payload : stringToArrayBuffer(payload);
    if (!key) throw Error('undefined key (Enigma.encrypt)');
    if (key.type === 'symmetric') {
      ivString = await Random.ivString();
      settings = _.extend(key.getAlgorithm(), { iv: stringToInitVector(ivString) });
    } else if (key.type === 'asymmetric') {
      settings = _.clone(key.getAlgorithm());
    }
    const ciphertext = await crypto.subtle.encrypt(settings, cryptoKey, buffer);
    return {
      text: raw ? ciphertext : arrayBufferToHex(ciphertext),
      iv: ivString,
    };
  } catch (exception) {
    const logger = console;
    logger.groupCollapsed('%c[Enigma] Unable to encrypt payload.', 'background: #FFF0F0; color: #FD4146');
    logger.error({ payload, key, raw });
    logger.groupEnd();
    throw exception;
  }
};

export default encrypt;
