// Copyright 2010 John Morrice
 
// This file is part of JOrbit.

// JOrbit is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// JOrbit is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with JOrbit.  If not, see <http://www.gnu.org/licenses/>.

// Something that can be collided with
function Collider()
{
   // Does the circle at x,y with radius r collide with this?
   this.intersect = function(x, y, r)
   {
      var distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
      // alert("client radius: " + r + " planet radius: " + this.radius + " distance: " + distance + "\nplanet x: " + this.x + " planet y: " + this.y + " client x: " + x + " client y: " + y);
      return distance <= Math.max(Math.abs(r), Math.abs(this.radius));
   }
}

// A target
function Target(paper, x, y)
{
   this.x = x;
   this.y = y;
   this.radius = 20;
   this.paper = paper;
   // Draw the rings
   this.draw = function()
   {
      var radius = this.radius;
      this.red_circle(radius);
      this.white_circle(2 * radius / 3);
      this.red_circle(4 * radius / 9);
      this.white_circle(8 * radius / 27);
   }
   this.red_circle = function(r)
   {
      this.paper.circle(this.x, this.y, r).attr({fill: "red", stroke: "red"});
   }
   this.white_circle = function(r)
   {
      this.paper.circle(this.x, this.y, r).attr({fill: "white", stroke: "white"});
   }

}

Target.prototype = new Collider;

// A crater
function Crater(paper, x, y)
{
   this.x = x;
   this.y = y;
   this.radius = 8;
   this.paper = paper;
   this.draw = function()
   {
      this.paper.circle(this.x, this.y, this.radius).attr({fill: "#111", stroke: "#111"});
   }
}

Crater.prototype = new Collider;

// A planet
function Planet(paper, x, y, r)
{
   this.x = x;
   this.y = y;
   this.mass = Math.PI * r * r;
   this.radius = r;
   this.craters = [];
   this.paper = paper;

   // The gravitational force acting on the particle
   this.gravity = function(x,y)
   {
      if (this.mass > 0)
      {
         var 
         distance_effect = Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
         mag = this.mass / distance_effect;
         return new Force(this.x - x, this.y - y, mag);
      }
      else
      {
         return 0;
      }
   }

   // Draw the planet
   this.draw = function()
   {
      this.paper.circle(this.x, this.y, this.radius).attr({fill: "green", stroke: "green"});
      for (var i in this.craters)
      {
         this.craters[i].draw();
      }
   }

   // Make a crater
   this.crater = function(x, y)
   {
      this.mass -= Math.PI * 10 * 10;
      this.craters.push(new Crater(this.paper, x, y));
   }

   // Does the circle at x,y with radius r collide with this?
   this.intersect = function(x, y, r)
   {
      var intersects = Planet.prototype.intersect.call(this, x, y, r);
      if (intersects)
      {
         for (var i in this.craters)
         {
            if (this.craters[i].intersect(x, y, r))
            {
               return false;
            }
         }
         return true;
      }
      return false;
   }
}

Planet.prototype = new Collider;

// A force
function Force(dx, dy, mag)
{
   if((dx != 0 || dy != 0) && mag != 0)
   {
      var max = Math.max(Math.abs(dx), Math.abs(dy));
      dx = dx / max;
      dy = dy / max;
      this.dx = mag * dx;
      this.dy = mag * dy;
   }
   else
   {
      this.dx = this.dy = 0;
   }
   this.combine = function(force)
   {
      this.dx += force.dx;
      this.dy += force.dy;
   }
}

// A bullet
function Bullet(world, x, y, dx, dy, mag)
{
   this.x = x;
   this.y = y;
   this.original_force = new Force(dx, dy, mag);
   this.paper = world.paper;
   this.planets = world.planets;
   this.target = world.target;
   this.max_x = world.width;
   this.min_x = 0;
   this.min_y = 0;
   this.max_y = world.height - 60;
   this.radius = 2;
   this.death = false;
   this.draw = function()
   {
      $("#bulletx").html("bullet x: " + this.x);
      $("#bullety").html("bullet y: " + this.y);
      this.paper.circle(this.x, this.y, this.radius).attr({fill: "white", stroke: "white"});
      var force = this.original_force;
      for (var i in this.planets)
      {
         force.combine(this.planets[i].gravity(this.x, this.y));
      }
      // Check for collision or out of range
      if (this.collision(force) || this.x >= this.max_x || this.x <= this.min_x || this.y <= this.min_y || this.y >= this.max_y)
      {
         this.death = true;
      }
      else if (this.win(force))
      {
         alert("Hooorah! You have won.");
         window.location.reload(true);
      }
      else
      {
         if (!isNaN(force.dx) && !isNaN(force.dy))
         {
            this.x += force.dx;
            this.y += force.dy;
         }
      }
   }

   // Does the bullet collide with a target
   this.win = function(force)
   {
      var me = this;
      return this.acollision(force, function(cx, cy)
      {
         return me.target.intersect(cx, cy, me.radius); 
      });
   }

   // Does the bullet collide with a planet
   this.collision = function(force)
   {
      var me = this;
      return this.acollision(force, function(cx, cy)
      {
         for (var i in me.planets)
         {
            if (me.planets[i].intersect(cx, cy, me.radius))
            {
               me.planets[i].crater(cx, cy);
               return true;
            }
         }
         return false;
      });
   }
   // Higher order collision detector
   this.acollision = function(force, fun)
   {
      var
      cx = this.x,
      cy = this.y,
      ex = this.x + force.dx,
      ey = this.y + force.dy;
      while (cx <= ex || cy <= ey)
      {
         if (fun(cx, cy))
         {
            return true;
         }
         cx ++;
         cy ++;
      }
      return false;
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
      pistol.attr({fill: "blue", stroke: "blue"});
      this.paper.circle(ax, ay, 2).attr({fill: "red", stroke: "red"});
   }
   
}

// The world
function World(paper, width, height)
{
   this.paper = paper;
   var launcher = new Launcher(this);
   this.gun = new Gun(paper, launcher, 20, height / 2);
   this.planets = [];
   this.width = width;
   this.height = height;

   // Are any planets intersected?
   this.intersects = function(x, y, r)
   {
      for (var j in this.planets)
      {
         if(this.planets[j].intersect(x, y, r * 1.5))
         {
            return true;
         }
      }
      return false;
   }
   // Create the planets
   this.create_planets = function()
   {
      // How many planets are (on average) required to fill the screen?
      var
      third_full = 10, // (width * height) / (3 * 30 * 30 * Math.PI),
      i = 0;
      while (i < third_full)
      {
         var
         rx = (Math.random() * (width - 100)) + 50,
         ry = (Math.random() * (height - 120)) + 60,
         rr = Math.random() * 60;
         
         while (this.intersects(rx, ry, rr))
         {
            rx = (Math.random() * (width - 100)) + 50;
            ry = (Math.random() * (height - 120)) + 60;
            rr = Math.random() * 60;
         }
         var plan = new Planet(this.paper, rx, ry, rr);
         this.planets.push(plan);
         i++;
      }
   }

   // Create the target
   this.create_target = function()
   {
      var
      tx = (Math.random() * (width / 2)) + width / 2,
      ty = (Math.random() * (height - 120)) + 60;
      while(this.intersects(tx, ty, 20))
      {
         tx = (Math.random() * (width / 2)) + width / 2;
         ty = (Math.random() * (height - 120)) + 60;
      }
      this.target = new Target(this.paper, tx, ty);
   }

   this.create_planets();
   this.create_target();

   // Draw the world!
   this.draw = function()
   {
      this.paper.clear();
      for (var i in this.planets)
      {
         this.planets[i].draw();
      }

      this.gun.draw();

      this.target.draw();

      if (this.bullet)
      {
         if (this.bullet.death)
         {
            this.bullet = false;
         }
         else
         {
            this.bullet.draw();
         }
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
   paper = Raphael(startx, starty, width, height); 
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
