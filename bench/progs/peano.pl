add(z, Y, Y).
add(s(X), Y, s(Z)) :- add(X, Y, Z).

toint(z, 0).
toint(s(X), N) :- toint(X, M), N is M + 1.

int2p(0, z).
int2p(N, s(P)) :- N > 0, M is N - 1, int2p(M, P).

main :-
    int2p(6, Six),
    findall(A-B, add(A, B, Six), Rs),
    forall(member(A-B, Rs),
           (toint(A, IA), toint(B, IB),
            format('{"a":~w,"b":~w}~n', [IA, IB]))).
