par(tom, bob).
par(tom, liz).
par(tom, ann).
par(bob, pat).

plen([], z).
plen([_|T], s(N)) :- plen(T, N).

who(tom).
who(bob).
who(liz).

kids(P, L, N) :- findall(X, par(P, X), L), plen(L, N).

row(P, L, N) :- who(P), kids(P, L, N).

toint(z, 0).
toint(s(X), N) :- toint(X, M), N is M + 1.

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall(P-L-N, row(P, L, N), Rs),
    forall(member(P-L-N, Rs),
           (jlist(L, J), toint(N, I),
            format('{"p":"~w","kids":~w,"n":~w}~n', [P, J, I]))).
