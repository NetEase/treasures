__resources__["/consts.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    module.exports = {

      aniOrientation:{
        LEFT_DOWN: 'LeftDown',
        LEFT_UP: 'LeftUp',
        RIGHT_DOWN: 'RightDown',
        RIGHT_UP: 'RightUp'
      },

      Border: {
        LEFT: 'left',
        RIGHT: 'right',
        TOP: 'top',
        BOTTOM: 'bottom'
      },

      EntityType: {
        PLAYER: 'player',
        EQUIPMENT: 'equipment',
        ITEM: 'item',
        TREASURE: 'treasure'
      },

      NodeCoordinate: {
        MAP_NODE: 0,
        PLAYER_NODE: 1,
        ITEM_NODE: 1,
        RED_BLOOD_NODE: 1.5,
        BLACK_BLOOD_NODE: 1.2,
        NAME_NODE: 1.5,
        UPDATE_NODE: 2,
        NUMBER_NODE: 2
      },

      CacheType: {
        IMAGE: 'image',
        FRAME_ANIM: 'frame_animation'
      }

    };
  }
};

