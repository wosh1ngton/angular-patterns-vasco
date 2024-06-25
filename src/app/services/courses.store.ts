import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { Course, sortCoursesBySeqNo } from "../model/course";
import { catchError, map, shareReplay, tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { LoadingService } from "../loading/loading.service";
import { MessageService } from "../messages/messages.service";

@Injectable({
    providedIn: 'root'
})
export class CoursesStore {

    private subject = new BehaviorSubject<Course[]>([]);
    courses$: Observable<Course[]> = this.subject.asObservable();

    constructor(private http: HttpClient,
        private loading: LoadingService,
        private message: MessageService
    ) {
        this.loadAllCourses();
    }

    filterByCategory(category: string): Observable<Course[]> {
        return this.courses$
            .pipe(
                map(courses => courses.filter(course => course.category == category)
                .sort(sortCoursesBySeqNo)
                )                    
            )
    }

    private loadAllCourses() {
        const loadCoureses$ = this.http.get<Course[]>('/api/courses')
            .pipe(
                map(response => response["payload"]),
                catchError(err => {
                    const message = "Não foi possível abrir os cursos";
                    this.message.showErrors(message);
                    console.log(message, err);
                    return throwError(err);
                }),
                tap(courses => this.subject.next(courses))
            );

            this.loading.showLoaderUntilCompleted(loadCoureses$)
                .subscribe();
    }

    saveCourse(courseId: string, changes: Partial<Course>) : Observable<any> {
        const courses = this.subject.getValue();
        const index = courses.findIndex(course => course.id == courseId);
        const newCourse: Course = {
            ...courses[index],
            ...changes
        };

        const newCourses: Course[] = courses.slice(0);
        newCourses[index] = newCourse;
        this.subject.next(newCourses);
        return this.http.put(`/api/courses/${courseId}`, changes)
            .pipe(
                catchError(err => {
                    const message = "não foi possível salvar";
                    console.log(message, err);
                    this.message.showErrors(message);
                    return throwError(err);
                }),
                shareReplay()
            );
    }

}