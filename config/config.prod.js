'use strict';

module.exports = appInfo => {
  return {

    logger: {
      dir: `${appInfo.baseDir}/logs/pro`,
      level: 'DEBUG',
      allowDebugAtProd: true,
    },

  };
}
;
