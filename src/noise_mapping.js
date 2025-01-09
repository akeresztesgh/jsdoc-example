let PerlinNoise = new function() {

    this.noise = function(x, y, z) {
    
       var p = new Array(512)
       var permutation = [ 151,160,137,91,90,15,
       131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
       190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
       88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
       77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
       102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
       135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
       5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
       223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
       129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
       251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
       49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
       138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
       ];
       for (var i=0; i < 256 ; i++) 
     p[256+i] = p[i] = permutation[i]; 
    
          var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
              Y = Math.floor(y) & 255,                  // CONTAINS POINT.
              Z = Math.floor(z) & 255;
          x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
          y -= Math.floor(y);                                // OF POINT IN CUBE.
          z -= Math.floor(z);
          var    u = fade(x),                                // COMPUTE FADE CURVES
                 v = fade(y),                                // FOR EACH OF X,Y,Z.
                 w = fade(z);
          var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
              B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,
    
          return scale(lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                         grad(p[BA  ], x-1, y  , z   )), // BLENDED
                                 lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                         grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                         lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                         grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                                 lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                         grad(p[BB+1], x-1, y-1, z-1 )))));
       }
       function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
       function lerp( t, a, b) { return a + t * (b - a); }
       function grad(hash, x, y, z) {
          var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
          var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
                 v = h<4 ? y : h==12||h==14 ? x : z;
          return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
       } 
       function scale(n) { return (1 + n)/2; }
    };

let perlin = {
        rand_vect: function(){
            let theta = Math.random() * 2 * Math.PI;
            return {x: Math.cos(theta), y: Math.sin(theta)};
        },
        dot_prod_grid: function(x, y, vx, vy){
            let g_vect;
            let d_vect = {x: x - vx, y: y - vy};
            if (this.gradients[[vx,vy]]){
                g_vect = this.gradients[[vx,vy]];
            } else {
                g_vect = this.rand_vect();
                this.gradients[[vx, vy]] = g_vect;
            }
            return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
        },
        smootherstep: function(x){
            return 6*x**5 - 15*x**4 + 10*x**3;
        },
        interp: function(x, a, b){
            return a + this.smootherstep(x) * (b-a);
        },
        seed: function(){
            this.gradients = {};
            this.memory = {};
        },
        get: function(x, y) {
            if (this.memory.hasOwnProperty([x,y]))
                return this.memory[[x,y]];
            let xf = Math.floor(x);
            let yf = Math.floor(y);
            //interpolate
            let tl = this.dot_prod_grid(x, y, xf,   yf);
            let tr = this.dot_prod_grid(x, y, xf+1, yf);
            let bl = this.dot_prod_grid(x, y, xf,   yf+1);
            let br = this.dot_prod_grid(x, y, xf+1, yf+1);
            let xt = this.interp(x-xf, tl, tr);
            let xb = this.interp(x-xf, bl, br);
            let v = this.interp(y-yf, xt, xb);
            this.memory[[x,y]] = v;
            return v;
        }
    }
    

var noiseMapper = tiled.registerAction("Noise Mapping", function(action) {

    if(!tiled.activeAsset || !tiled.activeAsset.isTileMap) {
		tiled.alert("Active asset must be a TileMap for noise map to be created.");
		return;
	}
	
	let map = tiled.activeAsset;
    if(map.tilesets.length < 1) {
		tiled.alert("The active map has no tilesets. Make sure a tileset is associated with the map!");
		return;
	}
    let layer = map.currentLayer.edit();
    let tileset = map.tilesets[0]
    if (!layer) {
        tiled.alert("No layer selected.");
        return;
    }
    if (!tileset) {
        tiled.alert("No tileset selected.");
        return;
    }
    if(layer.isTileLayer) {
        tiled.alert("Layer must be a tile layer.");
        return;
    }

    //layer.setTile(0, 0, tileset.tile(0))
    tiled.log(`Creating noise map... ${map.width}x${map.height}`);

    let result = Math.round(Math.random());
    let max = 0;
    let min = 10;
    if (result == 0) {
        tiled.log("Using Perlin noise #1");
        let seed = Math.random() * 2000;
        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                let height = PerlinNoise.noise(x/10, y/10, seed)
                if (height > max) max = height;
                if (height < min) min = height;
                console.log(height);
                if(height < 0.5) {
                    layer.setTile(x, y, tileset.tile(0))
                } else {
                    layer.setTile(x, y, tileset.tile(2))
                }
            }
        }
    } else {
        tiled.log("Using Perlin noise #2");
        perlin.seed();
        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                let height = perlin.get(x/10, y/10);
                if (height > max) max = height;
                if (height < min) min = height;
                if(height < 0.0) {
                    layer.setTile(x, y, tileset.tile(0))
                } else {
                    layer.setTile(x, y, tileset.tile(2))
                }
            }
        }        
    }
    tiled.log(`min: ${min}, max: ${max}`);
    layer.apply();
    tiled.log("Noise map created.");
});

noiseMapper.text = "Noise Mapping"; //display name for the action

//Add it to the Tileset menu. If you want it somewhere else, you can choose a different menu.
//If you type tiled.menus into the Tiled console, you can see a full list of modifiable menus.
tiled.extendMenu("Edit", [
	{ action: "Noise Mapping" }
]);