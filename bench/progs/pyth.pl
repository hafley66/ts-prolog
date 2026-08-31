times(X, Y, Z) :- Z is X*Y.

pyth(X, Y, Z) :-
    between(1, 13, X),
    between(X, 13, Y),
    times(X, X, XX),
    times(Y, Y, YY),
    plus(XX, YY, ZZ),
    between(Y, 20, Z),
    times(Z, Z, ZZ).

main :-
    findall(X-Y-Z, pyth(X, Y, Z), Rs),
    forall(member(X-Y-Z, Rs),
           format('{"x":~w,"y":~w,"z":~w}~n', [X, Y, Z])).
