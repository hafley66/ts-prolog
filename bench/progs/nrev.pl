app([], Y, Y).
app([H|T], Y, [H|R]) :- app(T, Y, R).

nrev([], []).
nrev([H|T], R) :- nrev(T, RT), app(RT, [H], R).

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall(R, nrev([e1, e2, e3, e4, e5, e6], R), [Rev]),
    jlist(Rev, J),
    format('{"r":~w}~n', [J]).
