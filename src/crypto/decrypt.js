import _ from 'lodash';
import hexToArrayBuffer from 'hex-to-array-buffer';
import ab2str from 'arraybuffer-to-string';
import stringToInitVector from '../utils/stringToInitVector';

const getCryptoKey = (key) => {
  if (key && _.isFunction(key.toCryptoKey)) {
    return key.toCryptoKey();
  }
};

const decrypt = async (cipher = {}, { key, raw = false }) => {
  try {
    const ciphertext = cipher.text;
    if (ciphertext) {
      const cryptoKey = getCryptoKey(key);
      const cipherBuffer = _.isArrayBuffer(ciphertext) ? ciphertext : hexToArrayBuffer(ciphertext);
      let settings;
      if (key.type === 'symmetric') {
        const iv = cipher.iv;
        const ivBuffer = _.isArrayBuffer(iv) ? iv : stringToInitVector(iv);
        settings = _.extend(key.getAlgorithm(), { iv: ivBuffer });
      } else if (key.type === 'asymmetric') {
        settings = key.getAlgorithm();
      }
      const buffer = await crypto.subtle.decrypt(settings, cryptoKey, cipherBuffer);
      return raw ? buffer : ab2str(buffer);
    }
    return null;
  } catch (exception) {
    const logger = console;
    logger.groupCollapsed('%c[Enigma] Unable to decrypt payload.', 'background: #FFF0F0; color: #FD4146');
    logger.error({ cipher, key, raw });
    logger.groupEnd();
    throw exception;
  }
};

export default decrypt;
