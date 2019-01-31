clear variables
format compact
clc

nbpix = 4;

% input matrix: Mr
Mreal = ones(nbpix)+diag(1:nbpix)
% to find the transforms, we need it to be invertible
det(Mreal)

% simulated output --> translation of one row to the left
Mmang = [Mreal(:,2:end), Mreal(:,1)]

% Mangling matrix
P = round(Mreal\Mmang*10^10)./10^10

% Pre-processing matrix
Pstar = inv(P)

% Pre-processed image
Mstar = Mreal*Pstar

% Simulation of vision with pre-processed image
Result = Mstar*P

% P2 = R/M

P2*M

