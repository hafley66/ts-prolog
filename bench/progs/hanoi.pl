app([], Y, Y).
app([H|T], Y, [H|R]) :- app(T, Y, R).

hanoi(z, _, _, _, []).
hanoi(s(N), F, T, V, Ms) :-
    hanoi(N, F, V, T, M1),
    hanoi(N, V, T, F, M2),
    app(M1, [m(F, T)|M2], Ms).

main :-
    findall(Ms, hanoi(s(s(s(z))), a, c, b, Ms), [Moves]),
    maplist([m(F, T), P]>>format(atom(P), '["~w","~w"]', [F, T]), Moves, Ps),
    atomic_list_concat(Ps, ',', Inner),
    format('{"moves":[~w]}~n', [Inner]).
