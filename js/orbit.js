// A force
function Force(dx, dy, mag)
{
   var max = Math.max(Math.abs(dx), Math.abs(dy));
   dx = dx / max;
   dy = dy / max;
   this.dx = mag * dx;
   this.dy = mag * dy;
}

// A bullet
function Bullet(world, x, y, dx, dy, mag)
{
   this.x = x;
   this.y = y;
   this.original_force = new Force(dx, dy, mag);
   this.paper = world.paper;
   this.draw = function()
   {
      this.paper.circle(this.x, this.y, 2).attr("fill", "white");
      planets = world.planets;
      force = this.original_force;
      for (var i in planets)
      {
         force.combine(planets[i].gravity(this.x, this.y));
      } 
      this.x += force.dx;
      this.y += force.dy;
   }
}

// Projectile launcher
function Launcher(world)
{
   this.world = world;
   // Force is 0
   this.force = 0;
   // Global variable for mouse down
   var mouse_down = false;
   // Mouse timer
   var mouse_timer = null;
   // Me!
   var me = this;
   // Set up event handlers for force
   $(document).mousedown(function(e)
   {
      if (!mouse_down)
      {
         mouse_down = true;
         mouse_timer = setInterval(function()
         {
            me.force ++;
            $("#force").html("force: " + me.force);
         }, 50);
      }
   });

   $(document).mouseup(function(e)
   {
      me.launch();
      me.force = 1;
      $("#force").html("force: 1");
      mouse_down = false;
      clearInterval(mouse_timer);
   });

   this.set_pos = function(x, y)
   {
      this.x = x;
      this.y = y;
   }

   this.set_dir = function(x, y)
   {
      this.dx = x;
      this.dy = y;
   }

   this.launch = function()
   {
      if (this.x && this.y && this.dx && this.dy)
      {
         this.world.new_bullet(this.x, this.y, this.dx, this.dy, this.force);
      }
   }
}

// Gun object
function Gun(paper, launcher, x, y)
{
   this.x = x;
   this.y = y;
   this.paper = paper;
   // Where we face
   this.theta = 0;
   this.launcher = launcher;

   // Set up mouse movement capture
   var me = this;
   $(document).mousemove(function(e)
   {
      me.launcher.set_dir(e.pageX - me.x - startx, e.pageY - me.y - starty);
      var
      face_x = e.pageX - me.x - startx,
      face_y = -(e.pageY - me.y - starty);
      me.theta = Math.atan(face_x/face_y);
      me.theta += Math.PI / 2;
      if (face_y > 0)
      {
         me.theta += Math.PI;
      }

      $("#x").html("x: " + face_x);
      $("#y").html("y: " + face_y);
      $("#theta").html("theta: " + me.theta);
   });

   // A triangle facing the mouse
   this.draw = function()
   {
      var length = 20,
      y = 0,
      x = 0,
      c1y = y + length / 2,
      c1x = x,
      ay = y,
      ax = x + length * 0.7071067811865476,
      c2y = y - length / 2,
      c2x = x,
      pts = [[x,y],[c1x,c1y],[ax,ay],[c2x,c2y]];

      // Rotate the triangle
      for (var i in pts)
      {
         var
         theta = this.theta,
         vector = pts[i],
         x = vector[0],
         y = vector[1],
         sin = Math.sin(theta),
         cos = Math.cos(theta);
         pts[i] = [this.x + (cos * x) - (sin * y), this.y + (sin * x) + (cos * y)]
      }

      x = pts[0][0];
      y = pts[0][1];
      c1x = pts[1][0];
      c1y = pts[1][1];
      ax = pts[2][0];
      ay = pts[2][1];
      c2x = pts[3][0];
      c2y = pts[3][1];

      this.launcher.set_pos(ax, ay);
 
      // The path we're drawing
      var start = "M" + x + " " + y;
      var corner1 = "L" + c1x + " " + c1y;
      var apex = "L" + ax + " " + ay;
      var corner2 = "L" + c2x + " " + " " + c2y;
      var end = "L" + x + " " + y;
      var turtle = [start, corner1, apex, corner2, end].join("");
      // var turtle = [start, apex].join("");
      var pistol = this.paper.path(turtle);
      pistol.attr({stroke: "blue"});
      this.paper.circle(ax, ay, 2).attr({stroke: "red"});
   }
   
}

// The world
function World(paper, width, height)
{
   this.paper = paper;
   this.planets = [];
   var launcher = new Launcher(this);
   this.gun = new Gun(paper, launcher, 20, height / 2);
   // Draw the world!
   this.draw = function()
   {
      this.paper.clear();
      this.gun.draw();
      if (this.bullet)
      {
         this.bullet.draw();
      }
   }
   // Create a new bullet
   this.new_bullet = function(x, y, dx, dy, mforce)
   {
      this.bullet = new Bullet(this, x, y, dx, dy, mforce);
   }
}

// Begin the game
function orbit()
{
   startx=0;
   starty=60;
   var
   width = screen.width,
   height = screen.height * 0.6,
   paper = Raphael(startx, starty, width, height); // Raphael("orbit", width, height),
   world = new World(paper, width, height),
   // Timer sync variable
   drawn = true;

   // Main loop
   setInterval(function()
   {
      if (drawn)
      {
         drawn = false;
         world.draw();
         drawn = true;
      }
   }, 30);
   
}
