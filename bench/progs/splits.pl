app([], Y, Y).
app([H|T], Y, [H|R]) :- app(T, Y, R).

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    Full = [e1, e2, e3, e4, e5, e6, e7, e8],
    findall(A-B, app(A, B, Full), Rs),
    forall(member(A-B, Rs),
           (jlist(A, JA), jlist(B, JB),
            format('{"a":~w,"b":~w}~n', [JA, JB]))).
