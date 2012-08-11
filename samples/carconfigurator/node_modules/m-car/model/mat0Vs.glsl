precision highp float;
attribute vec3 vert;
attribute vec3 normal;
varying vec3 v_normal;
uniform mat4 u_mvMatrix;
uniform mat3 u_normalMatrix;
uniform mat4 u_projMatrix;
varying vec4 v_vert;

void main(void) {
	v_normal = u_normalMatrix * normal;
	v_vert = u_mvMatrix * vec4(vert,1.0);
	gl_Position = u_projMatrix * v_vert;
}