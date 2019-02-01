clear variables
format compact
clc

nbpix = 4;

% Transformation matrices
% translation to the left
% P = [zeros(n

P = [   0     0     0     1;
        1     0     0     0;
        0     1     0     0;
        0     0     1     0];
% translation to the right
Pstar = [    0     1     0     0;
             0     0     1     0;
             0     0     0     1;
             1     0     0     0];


% Define the vector to randomize the input matrix with different rates of 1
% and 0
s = 2^(-53);
cut = [0.3:0.1:0.7].*(1-s)+s/2;

nb_per_cut = 10000;
tab_Mreal = zeros(nb_per_cut*length(cut),nbpix^2);
tab_Mmang = zeros(nb_per_cut*length(cut),nbpix^2);
tab_Mstar = zeros(nb_per_cut*length(cut),nbpix^2);

jj = 1;
for cc = 1:length(cut)
    ii = 1;
    while ii<nb_per_cut

        Mreal = double((rand(4,4) > cut(cc)));        
        Mmang = Mreal*P;
        Mstar = Mreal*Pstar;                
        
        tab_Mreal(jj,:) = reshape(Mreal, 1, nbpix^2);
        tab_Mmang(jj,:) = reshape(Mmang, 1, nbpix^2);
        tab_Mstar(jj,:) = reshape(Mmang, 1, nbpix^2);
        
        ii = ii+1;
        jj = jj+1;
    end
end
    
spy(tab_Mreal)    