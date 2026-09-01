sel(X, [X|T], T).
sel(X, [H|T], [H|R]) :- sel(X, T, R).

neq(X, Y) :- X =\= Y.

ok(_, [], _).
ok(Q, [P|Ps], D) :-
    plus(P, D, S1),
    neq(S1, Q),
    plus(Q, D, S2),
    neq(S2, P),
    plus(D, 1, D2),
    ok(Q, Ps, D2).

place([], Acc, Acc).
place(L, Acc, Qs) :-
    sel(Q, L, R),
    ok(Q, Acc, 1),
    place(R, [Q|Acc], Qs).

queens(Qs) :- place([1, 2, 3, 4, 5], [], Qs).

jlist(L, S) :-
    atomic_list_concat(L, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall(Qs, queens(Qs), Rs),
    forall(member(Qs, Rs), (jlist(Qs, J), format('{"q":~w}~n', [J]))).
